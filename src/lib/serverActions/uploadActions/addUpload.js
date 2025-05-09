"use server";

import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RoleBasedError } from "@/lib/classes";
import { calculateFileHash } from "@/lib/utils";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const addUpload = async (formData) => {
  formData.set("userId", "a59cd394-5f14-42e0-b559-e6f9e0fee105"); // TODO: remove this line when userId is passed from the client side
  try {
    const { type, userId } = formDataValidation(formData);

    if (["File", "API"].includes(type)) {
      const zipFile = formData.get("file");
      const { success, error } = await uploadByFileOrAPI({
        zipFile,
        type,
        userId,
      });
      if (!success) throw error;

      return {
        success: true,
        data: null,
        message: "Le fichier a été téléversé avec succès.",
      };
    }
  } catch (error) {
    const role = "superAdmin";

    return {
      success: false,
      data: null,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : `Erreur interne du serveur.\n${error.message}`,
    };
  }
};

const formDataValidation = (formData) => {
  const type = formData.get("type");
  const userId = formData.get("userId");

  if (!type || !userId) {
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nType de téléversement est manquant.`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
  if (!["Form", "File", "API"].includes(type)) {
    throw new RoleBasedError({
      0: `Erreur interne du serveur.Type de téléversement fourni est invalide : '${type}'. Les types acceptés sont : 'Form', 'File' ou 'API'.`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
  if (["File", "API"].includes(type)) {
    const zipFile = formData.get("file");
    if (!zipFile) {
      throw new RoleBasedError({
        0: `Aucun fichier n'a été téléversé, ou le fichier fourni est invalide. Veuillez sélectionner un fichier valide et réessayer.`,
        1: `Le fichier fourni est invalide. Veuillez sélectionner un fichier valide et réessayer.`,
      });
    }
    if (
      zipFile.type !== "application/zip" &&
      zipFile.type !== "application/x-zip-compressed"
    ) {
      throw new RoleBasedError({
        1: `Le fichier fourni doit être un fichier ZIP valide (format .zip).`,
      });
    }
  }
  return { type, userId };
};

const uploadByFileOrAPI = async (data) => {
  const { zipFile, type, userId } = data;

  try {
    const { fileData, hash } = await existenceValidation(zipFile);

    const date = new Date();
    const formattedDate = format(date, "yyyyMMdd");
    const rank = await getUploadRank(date);

    const fileName = zipFile.name;
    const name = `${format(date, "ddMMMMyyyy", {
      locale: fr,
    })}-${type}-${rank}`;
    const uploadPath = path.join(
      "data",
      "uploads",
      formattedDate,
      `${rank} - ${type} - ${fileName}`
    );

    await prisma.$transaction(async (prisma) => {
      await prisma.upload
        .create({
          data: {
            name,
            type,
            hash,
            fileName,
            path: uploadPath,
            user: { connect: { id: userId } },
          },
        })
        .catch((error) => {
          throw new RoleBasedError({
            0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la création du téléversement.\n${error.message}`,
            1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
          });
        });

      const targetPath = path.join(FILE_STORAGE_PATH, uploadPath);
      const dirPath = path.dirname(targetPath);
      await fs.mkdir(dirPath, { recursive: true }).catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de la création du répertoire de téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });
      await fs.writeFile(targetPath, fileData).catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de l'écriture du fichier de téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

const existenceValidation = async (zipFile) => {
  let isExist;
  try {
    const fileData = Buffer.from(await zipFile.arrayBuffer());
    const hash = calculateFileHash(fileData);
    isExist = await prisma.upload
      .findUnique({ where: { hash } })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la validation de l'existence du fichier.\n${error.message}`,
          1: `Erreur interne du serveur, au niveau de la base de données.\nContacter le Super administrateur.`,
        });
      });
    if (isExist) {
      throw new RoleBasedError({
        1: `Le fichier a été déjà téléversé.\nVeuillez utiliser un autre fichier.`,
      });
    }
    return { fileData, hash };
  } catch (error) {
    if (error instanceof RoleBasedError) {
      throw error;
    }
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la validation de l'existence du fichier.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};

const getUploadRank = async (date) => {
  try {
    const formattedDate = format(date, "yyyyMMdd");
    const startsWith = path
      .join("data", "uploads", formattedDate)
      .replace(/\\/g, "\\\\");

    const previousRank = await prisma.upload
      .count({
        where: {
          path: { startsWith },
        },
      })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la récupération du rang de téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    return previousRank + 1;
  } catch (error) {
    if (error instanceof RoleBasedError) {
      throw error;
    }
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la récupération du rang de téléversement.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};
