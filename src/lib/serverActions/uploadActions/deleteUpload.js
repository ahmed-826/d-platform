"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { RoleBasedError } from "@/lib/classes";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteUpload = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const { uploadToDelete, fichesToDelete, failedFichesToDelete } =
        await collectResourcesToDelete(prisma, id);

      await verifyResourcesExist([
        uploadToDelete,
        ...fichesToDelete,
        ...failedFichesToDelete,
      ]);

      await deleteDatabaseRecords(prisma, id);

      await deleteFilesystemResources(
        uploadToDelete,
        fichesToDelete,
        failedFichesToDelete
      );

      return {
        success: true,
        data: id,
        message: "Ressource supprimée avec succès.",
      };
    });
  } catch (error) {
    const role = "superAdmin";
    console.error(error); // Log the error for debugging

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

const collectResourcesToDelete = async (prisma, uploadId) => {
  let uploadToDelete = null;
  const fichesToDelete = [];
  const failedFichesToDelete = [];

  await prisma.upload
    .findUnique({
      where: { id: uploadId },
      select: { path: true },
    })
    .then((upload) => {
      if (!upload) {
        throw new RoleBasedError({
          1: `Téléversement introuvable. Veuillez rafraîchir la page.`,
        });
      }
      if (!upload.path) {
        throw new RoleBasedError({
          0: `Téléversement sans chemin d'accès.\nVeuillez utiliser le mode forcé.`,
          1: `Téléversement sans chemin d'accès.\nSignaler la ressource.`,
        });
      }

      uploadToDelete = path.join(FILE_STORAGE_PATH, upload.path);
    })
    .catch((error) => {
      if (error instanceof RoleBasedError) {
        throw error;
      }
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la collection du chemin d'accès de téléversement.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });

  await prisma.fiche
    .findMany({
      where: { uploadId },
      select: { path: true },
    })
    .then((fiches) => {
      fiches.forEach((fiche) => {
        if (!fiche?.path) {
          throw new RoleBasedError({
            0: `Fiche sans chemin d'accès.\nVeuillez utiliser le mode forcé.`,
            1: `Fiche sans chemin d'accès.\nSignaler la ressource.`,
          });
        }
        fichesToDelete.push(
          path.join(FILE_STORAGE_PATH, path.dirname(fiche.path))
        );
      });
    })
    .catch((error) => {
      if (error instanceof RoleBasedError) {
        throw error;
      }
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la collection des fiches.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });

  await prisma.failedFiche
    .findMany({
      where: { uploadId },
      select: { path: true },
    })
    .then((failedFiches) => {
      failedFiches.forEach((failedFiche) => {
        if (!failedFiche?.path) {
          throw new RoleBasedError({
            0: `Fiche échouée sans chemin d'accès.\nVeuillez utiliser le mode forcé.`,
            1: `Fiche échouée sans chemin d'accès.\nSignaler la ressource.`,
          });
        }
        failedFichesToDelete.push(
          FILE_STORAGE_PATH,
          path.dirname(failedFiches.path)
        );
      });
    })
    .catch((error) => {
      if (error instanceof RoleBasedError) {
        throw error;
      }
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la collection des fiches échouées.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });

  return { uploadToDelete, fichesToDelete, failedFichesToDelete };
};

const verifyResourcesExist = async (paths) => {
  await Promise.all(
    paths.map(async (path) => {
      await fs.access(path, fs.constants.F_OK).catch(() => {
        throw new RoleBasedError({
          0: `Ressources manquantes.\nLe fichier ou le répertoire suivant est introuvable:\n${path}.\n Veuillez utiliser le mode forcé.`,
          1: `Ressources manquantes.\nLe fichier ou le répertoire suivant est introuvable:\n${path}.\n Signaler la ressource.`,
        });
      });
    })
  );
};

const deleteDatabaseRecords = async (prisma, uploadId) => {
  await Promise.all([
    prisma.fiche.deleteMany({ where: { uploadId } }).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la suppression des fiches.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    }),
    prisma.failedFiche.deleteMany({ where: { uploadId } }).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la suppression des fiches échouées.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    }),
  ]);

  await prisma.upload.delete({ where: { id: uploadId } }).catch((error) => {
    throw new RoleBasedError({
      0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la suppression de téléversement.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  });
};

const deleteFilesystemResources = async (
  uploadToDelete,
  fichesToDelete,
  failedFichesToDelete
) => {
  const uploadDeletion = fs.unlink(uploadToDelete).catch((error) => {
    throw new RoleBasedError({
      0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de la suppression de téléversement.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  });

  const ficheDeletions = fichesToDelete.map((dirPath) =>
    fs.rm(dirPath, { recursive: true }).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de la suppression des fiches.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    })
  );

  const failedFicheDeletions = failedFichesToDelete.map((filePath) =>
    fs.unlink(filePath).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de la suppression des fiches échouées.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    })
  );

  await Promise.all([
    uploadDeletion,
    ...ficheDeletions,
    ...failedFicheDeletions,
  ]);
};
