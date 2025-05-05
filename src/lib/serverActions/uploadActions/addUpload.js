"use server";

import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { format } from "date-fns";
import { getUploadByHash } from "@/lib/services/uploadService";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const addUpload = async (data) => {
  const { uploadType, zipFile } = data;
  const userId = "a59cd394-5f14-42e0-b559-e6f9e0fee105";
  try {
    if (!uploadType) {
      throw new Error("Le type de téléversement est manquant.");
    }
    if (!["Form", "File", "API"].includes(uploadType)) {
      throw new Error("Le type de téléversement est invalide.");
    }
    if (["File", "API"].includes(uploadType)) {
      if (!zipFile) {
        throw new Error("Aucun fichier téléversé ou le fichier est invalide.");
      }

      const { error } = await uploadByFileOrAPI({
        zipFile,
        uploadType,
        userId,
      });
      if (error) {
        return { error };
      }
    }

    return { error: null };
  } catch (error) {
    return { error: { message: "Erreur interne du serveur." } };
  }
};

export const uploadByFileOrAPI = async (data) => {
  const { zipFile, uploadType, userId } = data;

  try {
    const fileData = Buffer.from(await zipFile.arrayBuffer());
    const hash = calculateFileHash(fileData);

    const existingUpload = await getUploadByHash(hash);
    if (existingUpload) {
      return {
        success: false,
        error: { message: "Ce fichier a déjà été ajouté." },
      };
    }

    const date = new Date();
    const formattedDate = format(date, "yyyyMMdd");
    const { base: fileName, name } = path.parse(zipFile.name);
    const uploadName = `${formattedDate}_${uploadType}_${name}`;

    await prisma.$transaction(async (prisma) => {
      let createdUpload;
      try {
        createdUpload = await prisma.upload.create({
          data: {
            name: uploadName,
            type: uploadType,
            hash,
            fileName,
            user: { connect: { id: userId } },
          },
          select: { id: true },
        });
        if (!createdUpload || !createdUpload.id) {
          throw new Error(
            "Le téléversement a été créé, mais aucune donnée n'a été retournée."
          );
        }
      } catch (error) {
        throw new Error(
          `Échec de la création du téléversement associé au fichier zip nommé '${name}'.\nCause :\n${error.message}`
        );
      }

      const uploadId = createdUpload.id;
      const uploadPath = path.join(
        "data",
        "upload",
        formattedDate,
        `${uploadId}_${name}.zip`
      );
      try {
        const updatedUpload = await prisma.upload.update({
          where: { id: uploadId },
          data: { path: uploadPath },
        });
        if (!updatedUpload || !updatedUpload.id) {
          throw new Error(
            "Le téléversement a été créé, mais aucune donnée n'a été retournée."
          );
        }
      } catch (error) {
        throw new Error(
          `Échec de la définition du chemin et du nom de fichier pour le téléversement associé au fichier zip nommé '${name}'.\nCause :\n${error.message}`
        );
      }

      try {
        const targetPath = path.join(FILE_STORAGE_PATH, uploadPath);
        const dirPath = path.dirname(targetPath);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(targetPath, fileData);
      } catch (error) {
        throw new Error(
          `Échec de l'écriture du fichier zip '${name}' dans le système de fichiers.\nCause :\n${error.message}`
        );
      }
    });

    return { error: null, status: 200 };
  } catch (error) {
    return { success: false, error: { message: "Erreur interne du serveur." } };
  }
};

function calculateFileHash(fileData) {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}
