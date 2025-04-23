"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import crypto from "crypto";
import JSZip from "jszip";
import { getUploadById, updateUploadById } from "@/lib/services/uploadService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const runUpload = async (uploadId) => {
  try {
    updateUploadById(uploadId, {
      status: "Processing",
    });

    const upload = await getUploadById(uploadId);
    if (!upload) {
      throw new Error("Téléversement introuvable.");
    }
    if (!upload.path) {
      throw new Error("Le chemin du téléversement est manquant.");
    }
    const fileData = await fs.readFile(
      path.join(FILE_STORAGE_PATH, upload.path)
    );
    const { error } = await getAndUploadProductsFromZipFile(fileData, uploadId);
    if (error) {
      throw new Error(error.message);
    }
    const updatedUpload = await updateUploadById(uploadId, {
      status: "Completed",
    });
    return formatUploadData(updatedUpload);
  } catch (error) {
    const updatedUpload = await updateUploadById(uploadId, {
      status: "Failed",
    });
    return formatUploadData(updatedUpload);
  }
};

const getAndUploadProductsFromZipFile = async (fileData, uploadId) => {
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

        if (jsonName && ficheName && documentsNames.length > 0) {
          const jsonData = await zip.file(jsonName).async("string");
          const ficheFile = await zip.file(ficheName).async("arraybuffer");
          const documentFiles = documentsNames.map(
            async (fileName) => await zip.file(fileName).async("arraybuffer")
          );

          const { error } = await productTransaction({
            jsonData,
            ficheFile,
            ficheName,
            documentFiles,
            uploadId,
          });
          if (error) {
            console.log("Error", error.message);
            //  await insertFailedFiche({ jsonData, ficheFile, documentFiles });
          }
        } else {
          continue;
        }

        const zipFiles = zipFileNames.map(
          async (fileName) => await zip.file(fileName).async("arraybuffer")
        );
        for (const zipFile of zipFiles) {
          await getAndUploadProductsFromZipFile(zipFile, uploadId);
        }
      } catch {}
    }

    return { error: null };
  } catch (error) {
    return { error: { message: error.message } };
  }
};

const productTransaction = async (data) => {
  const { jsonData, ficheFile, ficheName, documentFiles, uploadId } = data;

  try {
    return await prisma.$transaction(async (prisma) => {
      let dumpName, sourceName, summary, object, dateGenerate, documentsData;
      try {
        const jsonObject = JSON.parse(jsonData);

        dumpName = jsonObject.index;
        sourceName = jsonObject.source.name;
        summary = jsonObject.summary;
        object = jsonObject.object;
        dateGenerate = new Date(jsonObject.date_generate);
        documentsData = jsonObject.files.map((file) => ({
          type: file.type,
          fileName: file.original.filename,
          content: file.content,
          meta: file.meta,
          rpPath: file.path,
        }));
      } catch (error) {
        throw new Error("data.json mal structuré.");
      }

      if (documentsData.length !== documentFiles.length) {
        throw new Error(
          "Le nombre de documents source ne correspond pas au nombre de documents dans data.json."
        );
      }

      if (!sourceName) {
        throw new Error("La source est manquant dans data.json.");
      }
      const source = await prisma.source.findUnique({
        where: { name: sourceName },
      });
      if (!source || !source.id) {
        throw new Error(
          `La source '${sourceName}' est introuvable dans la base de données.`
        );
      }
      if (!dateGenerate || isNaN(dateGenerate.getTime())) {
        throw new Error(
          "La date de génération est manquant ou invalide dans data.json."
        );
      }
      if (!dumpName) {
        throw new Error("Le nom du dump est manquant dans data.json.");
      }
      let dump;
      dump = await prisma.dump.findUnique({
        where: { name: dumpName },
      });
      if (!dump) {
        dump = await prisma.dump.create({
          data: { name: dumpName, source: { connect: { id: source.id } } },
        });
        if (!dump || !dump.id) {
          throw new Error(
            `Échec de la création du dump avec le nom '${dumpName}'.`
          );
        }
      }

      const dumpId = dump.id;
      const formattedDateGenerate = format(dateGenerate, "yyyyMMdd");
      const { base: ficheBaseName, name: name } = path.parse(ficheName);
      const replacement = path.join(
        "data",
        "fiches",
        sourceName,
        formattedDateGenerate,
        name
      );
      const fichePath = path.join(replacement, ficheBaseName);
      const hash = calculateFileHash(Buffer.from(ficheFile));
      const existFiche = await prisma.fiche.findUnique({ where: { hash } });
      if (existFiche) {
        throw new Error("La fiche existe déjà.");
      }
      const ref = "ABC-" + Math.floor(100 + Math.random() * 900);
      const fiche = await prisma.fiche.create({
        data: {
          ref,
          object,
          summary,
          dateGenerate,
          path: fichePath,
          hash,
          upload: { connect: { id: uploadId } },
          dump: { connect: { id: dumpId } },
        },
      });
      if (!fiche || !fiche.id) {
        throw new Error(
          "Échec de la création de la fiche : aucun identifiant retourné."
        );
      }
      const ficheId = fiche.id;

      const documentPaths = [];
      for (const index in documentsData) {
        const doc = documentsData[index];
        const docBaseName = path.parse(doc.fileName).base;
        const docPath = path.join(replacement, "Source", docBaseName);
        documentPaths.push(docPath);
        const docHash = calculateFileHash(
          Buffer.from(await documentFiles[index])
        );
        const existDocument = await prisma.document.findUnique({
          where: { hash },
        });
        if (existDocument) {
          throw new Error("L'un des documents sources existe déjà.");
        }
        await prisma.document.create({
          data: {
            type: doc.type,
            content: doc.content,
            meta: doc.meta,
            path: docPath,
            hash: docHash,
            fiche: { connect: { id: ficheId } },
          },
        });
      }

      const addedPaths = [];
      try {
        try {
          const targetPath = path.join(FILE_STORAGE_PATH, fichePath);
          const dirPath = path.dirname(targetPath);
          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(targetPath, Buffer.from(ficheFile));
          addedPaths.push(targetPath);
        } catch {
          throw new Error("Échec d'enregistrer la fiche.");
        }

        for (const index in documentsData) {
          try {
            const targetPath = path.join(
              FILE_STORAGE_PATH,
              documentPaths[index]
            );
            const dirPath = path.dirname(targetPath);
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(
              targetPath,
              Buffer.from(await documentFiles[index])
            );
            addedPaths.push(targetPath);
          } catch {
            throw new Error(
              "Échec de l'enregistrement de l'un des documents sources."
            );
          }
        }
      } catch (error) {
        for (const addedPath of addedPaths) {
          await fs.unlink(addedPath);
        }

        throw new Error(error.message);
      }

      return { error: null };
    });
  } catch (error) {
    return { error: { message: error.message } };
  }
};

function calculateFileHash(fileData) {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}

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

const formatUploadData = (upload) => ({
  id: upload.id,
  name: upload.name,
  status: upload.status,
  date: format(upload.date, "dd MMMM yyyy 'à' HH:mm:ss", {
    locale: fr,
  }),
  user: upload.user.username,
  type: upload.type,
  successfulFichesCount: upload.fiches.length,
  totalFichesCount: upload.fiches.length + upload.failedFiches.length,
});
