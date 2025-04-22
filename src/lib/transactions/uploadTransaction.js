import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { format } from "date-fns";
import { getUploadByHash } from "@/lib/services/uploadService";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

function calculateFileHash(fileData) {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}

export const uploadTransaction = async (data) => {
  const { zipFile, uploadType, userId } = data;

  try {
    const fileData = Buffer.from(await zipFile.arrayBuffer());
    const hash = calculateFileHash(fileData);

    const existingUpload = await getUploadByHash(hash);
    if (existingUpload) {
      return {
        error: { message: "Ce fichier a déjà été ajouté." },
        status: 409,
      };
    }

    const date = new Date();
    const formattedDate = format(date, "yyyyMMdd");
    const uploadName = `${uploadType}_${formattedDate}`;
    const fileName = zipFile.name;

    await prisma.$transaction(async (prisma) => {
      let createdUpload;
      try {
        createdUpload = await prisma.upload.create({
          data: {
            name: uploadName,
            type: uploadType,
            hash,
            user: { connect: { id: userId } },
          },
          select: { id: true },
        });
        if (!createdUpload || !createdUpload.id) {
          throw new Error("Upload was created, but no data was returned.");
        }
      } catch (error) {
        throw new Error(
          `Failed to create upload associated with the zip file named '${fileName}'.\nCaused by:\n${error.message}`
        );
      }

      const uploadId = createdUpload.id;
      const targetPath = path.join(
        FILE_STORAGE_PATH,
        "upload",
        formattedDate,
        `${uploadId}_${fileName}`
      );
      try {
        const updatedUpload = await prisma.upload.update({
          where: { id: uploadId },
          data: { path: targetPath, fileName: fileName },
        });
        if (!updatedUpload || !updatedUpload.id) {
          throw new Error("Upload was created, but no data was returned.");
        }
      } catch (error) {
        throw new Error(
          `Failed to set path and fileName for the upload associated with the zip file named '${fileName}'.\nCaused by:\n${error.message}`
        );
      }

      try {
        const dirPath = path.dirname(targetPath);
        await fs.mkdir(dirPath, { recursive: true });

        await fs.writeFile(targetPath, fileData);
      } catch (error) {
        throw new Error(
          `Failed to write zip file '${fileName}' to the file system.\nCaused by:\n${error.message}`
        );
      }
    });

    return { error: null, status: 200 };
  } catch (error) {
    return { error: { message: error.message }, status: 500 };
  }
};
