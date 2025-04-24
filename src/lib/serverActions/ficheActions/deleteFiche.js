"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteFiche = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const fiche = await prisma.fiche.delete({
        where: { id },
      });

      const folderPath = path.join(FILE_STORAGE_PATH, path.dirname(fiche.path));
      await fs.rm(folderPath, { recursive: true, force: true });

      return true;
    });
  } catch {
    return false;
  }
};

export const deleteMultipleFiches = async (ids) => {
  const deletedFichesIds = [];
  let failedFiches = false;
  for (const id of ids) {
    try {
      await prisma.$transaction(async (prisma) => {
        const fiche = await prisma.fiche.delete({
          where: { id },
        });

        const folderPath = path.join(
          FILE_STORAGE_PATH,
          path.dirname(fiche.path)
        );
        await fs.rm(folderPath, { recursive: true, force: true });
        deletedFichesIds.push(id);
      });
    } catch {
      failedFiches = true;
    }
  }
  return { deletedFichesIds: deletedFichesIds, failedFiches: failedFiches };
};
