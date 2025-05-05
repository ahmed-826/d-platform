"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteUpload = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const { filesToDelete, directoriesToDelete } =
        await collectResourcesToDelete(prisma, id);

      await verifyResourcesExist([...filesToDelete, ...directoriesToDelete]);

      await deleteDatabaseRecords(prisma, id);

      await deleteFilesystemResources(filesToDelete, directoriesToDelete);

      return { success: true };
    });
  } catch (error) {
    console.error(`Failed to delete upload ${id}:`, error);
    return formatErrorResponse(error);
  }
};

// Functions

async function collectResourcesToDelete(prisma, uploadId) {
  const filesToDelete = [];
  const directoriesToDelete = [];

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { path: true },
  });

  if (upload?.path) {
    filesToDelete.push(path.join(FILE_STORAGE_PATH, upload.path));
  }

  const fiches = await prisma.fiche.findMany({
    where: { uploadId },
    select: { path: true },
  });

  for (const fiche of fiches) {
    if (fiche.path) {
      directoriesToDelete.push(
        path.join(FILE_STORAGE_PATH, path.dirname(fiche.path))
      );
    }
  }

  const failedFiches = await prisma.failedFiche.findMany({
    where: { uploadId },
    select: { path: true },
  });

  for (const failedFiche of failedFiches) {
    if (failedFiche.path) {
      filesToDelete.push(failedFiche.path);
    }
  }

  return {
    filesToDelete: filesToDelete,
    directoriesToDelete: directoriesToDelete,
  };
}

async function verifyResourcesExist(paths) {
  const missingPaths = [];

  await Promise.all(
    paths.map(async (path) => {
      try {
        await fs.access(path);
      } catch {
        missingPaths.push(path);
      }
    })
  );

  if (missingPaths.length > 0) {
    throw new Error(
      `Resources missing:\n${missingPaths
        .slice(0, 3)
        .map((p) => `• ${p}`)
        .join("\n")}${
        missingPaths.length > 3
          ? `\n...and ${missingPaths.length - 3} more`
          : ""
      }`
    );
  }
}

async function deleteDatabaseRecords(prisma, uploadId) {
  await Promise.all([
    prisma.fiche.deleteMany({ where: { uploadId } }),
    prisma.failedFiche.deleteMany({ where: { uploadId } }),
  ]);

  await prisma.upload.delete({ where: { id: uploadId } });
}

async function deleteFilesystemResources(filesToDelete, directoriesToDelete) {
  const fileDeletions = filesToDelete.map((filePath) =>
    fs.unlink(filePath).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    })
  );

  const dirDeletions = directoriesToDelete.map((dirPath) =>
    fs.rm(dirPath, { recursive: true, force: true })
  );

  await Promise.all([...fileDeletions, ...dirDeletions]);
}

function formatErrorResponse(error) {
  if (error.message.startsWith("Resources missing")) {
    return {
      success: false,
      error: `Impossible de trouver tous les fichiers:\n${error.message
        .split("\n")
        .slice(1)
        .join("\n")}`,
    };
  }

  if (error.code === "P2025") {
    return {
      success: false,
      error: "L'upload n'existe pas dans la base de données",
    };
  }

  return {
    success: false,
    error: "Une erreur technique est survenue lors de la suppression",
  };
}
