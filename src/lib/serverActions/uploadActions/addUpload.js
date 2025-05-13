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
    formDataValidation(formData);
    const type = formData.get("type");

    if (["File", "API"].includes(type)) {
      await uploadByFileOrAPI(formData);

      return {
        success: true,
        data: null,
        message: "Le fichier a été téléversé avec succès.",
      };
    }
    if (type === "Form") {
      await uploadByForm(formData);
      return {
        success: true,
        data: null,
        message: "Le formulaire a été téléversé avec succès.",
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

  if (!type) {
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nType de téléversement est manquant.`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
  if (!userId) {
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nID utilisateur est manquant.`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
  if (!["Form", "File", "API"].includes(type)) {
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nType de téléversement fourni est invalide : '${type}'. Les types acceptés sont : 'Form', 'File' ou 'API'.`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
  if (["File", "API"].includes(type)) {
    const zipFile = formData.get("file");
    if (!zipFile) {
      throw new RoleBasedError({
        1: `Aucun fichier n'a été téléversé, ou le fichier fourni est invalide. Veuillez sélectionner un fichier valide et réessayer.`,
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
  if (type === "Form") {
    const source = formData.get("source");
    const object = formData.get("object");
    const summary = formData.get("summary");
    const documents = formData.getAll("documents");
    if (!source) {
      throw new RoleBasedError({ 1: `Source est manquante.` });
    }
    if (!object) {
      throw new RoleBasedError({ 1: `Objet est manquant.` });
    }
    if (!summary) {
      throw new RoleBasedError({ 1: `Synthèse est manquante.` });
    }
    if (documents.length === 0) {
      throw new RoleBasedError({ 1: `Document source sont manquantes.` });
    }
  }
};

const uploadByFileOrAPI = async (formData) => {
  const type = formData.get("type");
  const userId = formData.get("userId");
  const zipFile = formData.get("file");

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
};

const existenceValidation = async (zipFile) => {
  try {
    const fileData = Buffer.from(await zipFile.arrayBuffer());
    const hash = calculateFileHash(fileData);

    await prisma.upload
      .findUnique({ where: { hash } })
      .then((upload) => {
        if (upload) {
          throw new RoleBasedError({
            1: `Le fichier a été déjà téléversé.\nVeuillez utiliser un autre fichier.`,
          });
        }
      })
      .catch((error) => {
        if (error instanceof RoleBasedError) {
          throw error;
        }
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la validation de l'existence du fichier.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

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

const uploadByForm = async (formData) => {
  const userId = formData.get("userId");
  const type = formData.get("type");
  const source = formData.get("source");
  const object = formData.get("object");
  const summary = formData.get("summary");
  const documents = formData.getAll("documents");
  const date = new Date();
  const formattedDate = format(date, "yyyyMMdd");
  let dump = formData.get("dump");
  if (dump) {
    dump = `files_${source}-${formattedDate}_dp`;
  }
  const jsonData = {
    index: dump,
    summary,
    object,
    date_generate: date,
    source: { name: source, date_collect: date },
    files: documents.map((document) => ({
      type: document.name.endsWith(".eml") ? "Email" : "File",
    })),
  };

  const rank = await getUploadRank(date);
  const fileName = `Formulaire-${source}_${formattedDate}`;
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
  });
};
