"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { RoleBasedError } from "@/lib/classes";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteUpload = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const { filesToDelete, directoriesToDelete } =
        await collectResourcesToDelete(prisma, id);

      await verifyResourcesExist([...filesToDelete, ...directoriesToDelete]);

      await deleteDatabaseRecords(prisma, id);

      await deleteFilesystemResources(filesToDelete, directoriesToDelete);

      return {
        success: true,
        data: id,
        message: "Ressource supprimée avec succès.",
      };
    });
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

const collectResourcesToDelete = async (prisma, uploadId) => {
  const filesToDelete = [];
  const directoriesToDelete = [];

  const upload = await prisma.upload
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
          1: `Téléversement sans chemin d'accès.\nSignaler cette ressource.`,
        });
      }

      return upload;
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

  filesToDelete.push(path.join(FILE_STORAGE_PATH, upload.path));

  await prisma.fiche
    .findMany({
      where: { uploadId },
      select: { path: true },
    })
    .then((fiches) => {
      fiches.forEach((fiche) => {
        if (!fiche?.path) {
          throw new RoleBasedError({
            0: `L'un des fiches est sans chemin d'accès.\nVeuillez utiliser le mode forcé.`,
            1: `L'un des fiches est sans chemin d'accès.\nSignaler la ressource.`,
          });
        }
        directoriesToDelete.push(
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
            0: `L'un des fiches échouées est sans chemin d'accès.\nVeuillez utiliser le mode forcé.`,
            1: `L'un des fiches échouées est sans chemin d'accès.\nSignaler la ressource.`,
          });
        }
        filesToDelete.push();
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

  return { filesToDelete, directoriesToDelete };
};

const verifyResourcesExist = async (paths) => {
  await Promise.all(
    paths.map(async (path) => {
      await fs.access(path, fs.constants.F_OK).catch(() => {
        throw new RoleBasedError({
          1: `Ressources manquantes.\nLe fichier ou le répertoire suivant est introuvable:\n${path}`,
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
      0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la suppression du téléversement.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  });
};

async function deleteFilesystemResources(filesToDelete, directoriesToDelete) {
  const fileDeletions = filesToDelete.map((filePath) =>
    fs.unlink(filePath, fs.constants.F_OK).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur.\nErreur lors de la suppression des fichiers.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    })
  );

  const dirDeletions = directoriesToDelete.map((dirPath) =>
    fs.rm(dirPath, { recursive: true }).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur.\nErreur lors de la suppression des répertoires.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    })
  );

  await Promise.all([...fileDeletions, ...dirDeletions]);
}
