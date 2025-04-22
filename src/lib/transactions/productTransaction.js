import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import JSZip from "jszip";
import { format } from "date-fns";
import { getUploadByHash, getUploadById } from "@/lib/services/uploadService";
import { getSourceByName } from "../services/sourceService";
import { createDump, getDumpByName } from "../services/dumpService";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

function calculateFileHash(fileData) {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}

export const productTransaction = async (data) => {
  const { jsonData, ficheData, ficheName, documentsData, uploadId } = data;

  await prisma.$transaction(async (prisma) => {
    const {
      index: dumpName,
      source: { name: sourceName },
      summary,
      object,
      date_generate: dateGenerate,
      files,
    } = JSON.parse(jsonData);

    const formattedFiles = files.map((file) => ({
      type: file.type,
      fileName: file.original.filename,
      content: file.content,
      meta: file.meta,
      rpPath: file.path,
    }));

    if (formattedFiles.length !== documentsData.length) {
      throw new Error();
    }

    if (!sourceName) {
      throw new Error();
    }
    const source = await prisma.source.findUnique({
      where: { name: sourceName },
    });
    if (!source || !source.id) {
      throw new Error("");
    }
    if (!dateGenerate) {
      throw new Error("");
    }
    if (!dumpName) {
      throw new Error("");
    }
    let dump;
    dump = await prisma.dump.findUnique({
      where: { name: dumpName },
    });
    if (!dump) {
      dump = await prisma.dump.create({
        data: { name: dumpName, source: { connect: { id: source.id } } },
      });
    }
    const dumpId = dump.id;
    const name = ficheName;
    const extension = "";
    const replacement = "";
    const hash = calculateFileHash(Buffer.from(ficheData));
    const fiche = await prisma.fiche.create({
      data: {
        object,
        summary,
        dateGenerate: new Date(dateGenerate),
        name,
        extension,
        replacement,
        hash,
        upload: { connect: { id: uploadId } },
        dump: { connect: { id: dumpId } },
      },
    });
    if (!fiche || !fiche.id) {
      throw new Error();
    }
    const ficheId = fiche.id;

    for (index in formattedFiles) {
      const doc = formattedFiles[index];
      const {
        base: baseName,
        name: docName,
        ext: docExtension,
      } = path.parse(doc.fileName);
      const docReplacement = `${replacement}/Source/${baseName}`;
      const docHash = calculateFileHash(Buffer.from(ficheData));
      await prisma.document.create({
        data: {
          name: docName,
          type: doc.type,
          content: doc.content,
          meta: doc.meta,
          extension: docExtension,
          replacement: docReplacement,
          hash: docHash,
          fiche: { connect: { id: ficheId } },
        },
      });
    }
    console.log({
      dumpName,
      sourceName,
      summary,
      object,
      dateGenerate,
      formattedFiles,
    });
  });

  try {
  } catch (error) {
    return { isSuccessful: false, message: error.message };
  }
};

export const getProductsFromZipFile = async (fileData, uploadId) => {
  try {
    const zip = await JSZip.loadAsync(fileData);

    const fileNames = Object.keys(zip.files).filter(
      (fileName) => !zip.files[fileName].dir
    );

    const folders = Object.keys(zip.files).filter(
      (fileName) => zip.files[fileName].dir
    );
    folders.push("./");

    for (const folder of folders) {
      try {
        const fileNamesInFolder = fileNames.filter(
          (fileName) => !path.relative(folder, fileName).includes(path.sep)
        );
        const jsonName = fileNamesInFolder.find((fileName) =>
          fileName.endsWith("data.json")
        );
        const ficheName = fileNamesInFolder.find((fileName) =>
          isFiche(fileName)
        );
        const documentsNames = fileNamesInFolder.filter(
          (fileName) => isDocument(fileName) && fileName !== ficheName
        );
        const zipFileNames = fileNamesInFolder.filter((fileName) =>
          fileName.endsWith(".zip")
        );

        if (!jsonName || !ficheName || documentsNames.length === 0) {
          continue;
        } else {
          const jsonData = await zip.file(jsonName).async("string");
          const ficheData = await zip.file(ficheName).async("arraybuffer");
          const documentsData = documentsNames.map(
            async (fileName) => await zip.file(fileName).async("arraybuffer")
          );

          const { isSuccessful, message } = productTransaction({
            jsonData,
            ficheData,
            ficheName,
            documentsData,
            uploadId,
          });
        }

        const zipFiles = zipFileNames.map(
          async (fileName) => await zip.file(fileName).async("arraybuffer")
        );
        for (const zipFile of zipFiles) {
          await getProductFromZipFile(zipFile, uploadId);
        }
      } catch {
        console.log("handle failed fiche here.");
      }
    }
  } catch (error) {
    console.log("Error here:", error.message);
  }
};

const isFiche = (fileName) => {
  return fileName.endsWith(".docx");
};

const isDocument = (fileName) => {
  return (
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".eml") ||
    fileName.endsWith(".xlsx")
  );
};
