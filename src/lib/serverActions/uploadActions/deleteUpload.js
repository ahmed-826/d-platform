"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteUpload = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const upload = await prisma.upload.delete({
        where: { id },
      });

      await fs.unlink(path.join(FILE_STORAGE_PATH, upload.path));
      return true;
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};
