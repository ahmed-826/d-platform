"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import crypto from "crypto";
import JSZip from "jszip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const FILE_TYPES = {
  FICHE: [".docx"],
  DOCUMENT: [".pdf", ".eml", ".xlsx"],
};

const PATH_CONFIG = {
  FICHES: path.join("data", "fiches"),
  FAILED: path.join("data", "Fiches échouées"),
  SOURCE: "Source",
};

export const runUpload = async (uploadId) => {
  try {
    await updateUploadStatus(uploadId, "Processing");

    const validationResult = uploadValidation(uploadId);
    if (!validationResult.success) {
      await updateUploadStatus(uploadId, "Failed");
      return validationResult;
    }

    const zipFileData = validationResult.data;
    const precessResult = await processZipFile(zipFileData, uploadId);
    if (!precessResult.success) {
      await updateUploadStatus(uploadId, "Failed");
      return precessResult;
    }

    const upload = completedUpload(uploadId);
    return { success: true, data: upload, error: null };
  } catch (error) {
    await updateUploadStatus(uploadId, "Failed");
    return { success: false, error: { message: "Erreur interne du serveur" } };
  }
};

const updateUploadStatus = async (uploadId, status) => {
  await prisma.upload.update({ where: { id: uploadId }, data: { status } });
};

const completedUpload = async (uploadId) => {
  const upload = await prisma.upload.update({
    where: { id: uploadId },
    data: { status: "Completed" },
    include: {
      user: true,
      fiches: {
        include: {
          dump: {
            include: {
              source: true,
            },
          },
        },
      },
      failedFiches: true,
    },
  });
  const formattedUpload = {
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
  };
  return formattedUpload;
};

const uploadValidation = async (uploadId) => {
  try {
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });

    //
    if (!upload) {
      throw new Error(
        "Aucun téléversement correspondant n'a été trouvé dans la base de données. Veuillez recharger la page ou réessayer plus tard"
      );
    }

    //
    if (!upload.path) {
      throw new Error(
        "Le chemin d'accès au fichier téléversé est manquant. Cela peut indiquer que le traitement est toujours en cours ou que le fichier est incomplet. Veuillez patienter ou supprimer puis recréer le téléversement."
      );
    }

    const absolutePath = path.join(FILE_STORAGE_PATH, upload.path);
    //
    try {
      await fs.access(absolutePath, fs.constants.F_OK);
    } catch {
      throw new Error(
        `Le fichier lié au téléversement est introuvable à l'emplacement suivant : ${absolutePath}. Vérifiez qu'il n'a pas été déplacé ou supprimé manuellement.`
      );
    }

    //
    try {
      const fileData = await fs.readFile(absolutePath);
      return { success: true, data: fileData };
    } catch (error) {
      throw new Error(
        `Impossible de lire le fichier lié au téléversement à l'emplacement : ${absolutePath}. Il peut être corrompu ou inaccessible. Supprimez ce téléversement et ajoutez-en un nouveau.`
      );
    }
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const processZipFile = async (zipFileData, uploadId) => {
  try {
    let zipFile, fileNames, folders;
    try {
      zipFile = await JSZip.loadAsync(zipFileData);
      fileNames = Object.keys(zipFile.files).filter(
        (fileName) => !zipFile.files[fileName].dir
      );
      folders = [...new Set(Object.keys(zipFile.files).map(path.dirname))];
    } catch {
      throw new Error("Le fichier zip est corrompu");
    }

    await Promise.all(
      folders.map(async (folder) => {
        await processFolder(zipFile, fileNames, folder, uploadId);
      })
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const processFolder = async (zipFile, fileNames, folder, uploadId) => {
  try {
    const fileNamesInFolder = fileNames.filter(
      (fileName) => path.dirname(fileName) === folder
    );

    // Process product
    try {
      const jsonName = fileNamesInFolder.find((fileName) =>
        fileName.endsWith("data.json")
      );
      const ficheName = fileNamesInFolder.find(isFiche);
      const documentsNames = fileNamesInFolder.filter(
        (fileName) => isDocument(fileName) && fileName !== ficheName
      );

      if (jsonName && ficheName && documentsNames.length > 0) {
        await processProduct(zipFile, {
          jsonName,
          ficheName,
          documentsNames,
          uploadId,
        });
      }
    } catch (error) {
      console.error(`Error in product of folder ${folder}: ${error.message}`);
    }

    // Process nested zip files
    try {
      const zipFileNames = fileNamesInFolder.filter((fileName) =>
        fileName.endsWith(".zip")
      );
      await Promise.all(
        zipFileNames.map(async (zipFileName) => {
          const nestedZipFile = await zipFile
            .file(zipFileName)
            .async("arraybuffer");
          await processZipFile(nestedZipFile, uploadId);
        })
      );
    } catch (error) {
      console.error(
        `Error in nested zip file of folder ${folder}: ${error.message}`
      );
    }
  } catch (error) {
    console.error(`Error in folder ${folder}: ${error.message}`);
  }
};

const processProduct = async (zipFile, data) => {
  try {
    const { jsonName, ficheName, documentsNames, uploadId } = data;
    const jsonData = await zipFile.file(jsonName).async("string");
    const ficheData = await zipFile
      .file(ficheName)
      .async("arraybuffer")
      .then((buf) => Buffer.from(buf));
    const documentsData = await Promise.all(
      documentsNames.map((fileName) =>
        zipFile
          .file(fileName)
          .async("arraybuffer")
          .then((buf) => Buffer.from(buf))
      )
    );

    const jsonValidationResult = jsonValidation(jsonData, documentsData.length);
    if (!jsonValidationResult.success) {
      // failed fiche
    }

    const jsonValidationResultData = jsonValidationResult.data;
    const transactionResult = await productTransaction(
      jsonValidationResultData,
      ficheName,
      ficheData,
      documentsData,
      uploadId
    );
    if (!transactionResult.success) {
      // failed fiche
    }
  } catch (error) {
    console.error(`Error processing product: ${error.message}`);
  }
};

const jsonValidation = async (jsonData, documentsDataLength) => {
  try {
    let dumpName,
      sourceName,
      dateCollect,
      summary,
      object,
      dateGenerate,
      documentsInfo;
    try {
      const jsonObject = JSON.parse(jsonData);

      dumpName = jsonObject.index;
      sourceName = jsonObject.source.name;
      dateCollect = new Date(jsonObject.source.date_collect);
      summary = jsonObject.summary;
      object = jsonObject.object;
      dateGenerate = new Date(jsonObject.date_generate);
      documentsInfo = jsonObject.files.map((file) => ({
        type: file.type,
        fileName: file.original.filename,
        content: file.content,
        meta: file.meta,
        rpPath: file.path,
      }));
    } catch (error) {
      throw new Error("data.json mal structuré");
    }

    if (documentsInfo.length !== documentsDataLength) {
      throw new Error(
        "Le nombre de documents source ne correspond pas au nombre de documents dans data.json"
      );
    }
    if (!sourceName) {
      throw new Error("La source est manquant dans data.json");
    }
    const source = await prisma.source.findUnique({
      where: { name: sourceName },
    });
    if (!source || !source.id) {
      throw new Error(
        `La source '${sourceName}' est introuvable dans la base de données`
      );
    }
    if (!dateGenerate || isNaN(dateGenerate.getTime())) {
      throw new Error(
        "La date de génération est manquant ou invalide dans data.json"
      );
    }
    if (!dumpName) {
      throw new Error("Le nom du dump est manquant dans data.json");
    }
    if (!dateCollect || isNaN(dateCollect.getTime())) {
      throw new Error(
        "La date de collecte du dump est manquant ou invalide dans data.json"
      );
    }
    let dump;
    dump = await prisma.dump.findUnique({
      where: { name: dumpName },
    });
    if (!dump) {
      dump = await prisma.dump.create({
        data: {
          name: dumpName,
          dateCollect,
          source: { connect: { id: source.id } },
        },
      });
      if (!dump || !dump.id) {
        throw new Error(
          `Échec de la création du dump avec le nom '${dumpName}'`
        );
      }
    }
    const dumpId = dump.id;
    return {
      dumpId,
      sourceName,
      summary,
      object,
      dateGenerate,
      documentsInfo,
    };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const productTransaction = async (
  validationResultData,
  ficheName,
  ficheData,
  documentsData,
  uploadId
) => {
  try {
    const { dumpId, sourceName, summary, object, dateGenerate, documentsInfo } =
      validationResultData;
    return await prisma.$transaction(async (prisma) => {
      const fichePath = buildFichePath(sourceName, dateGenerate, ficheName);
      const hash = calculateFileHash(ficheData);

      await checkForDuplicateFiles(prisma, hash);

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

      const documentPaths = await processDocuments(prisma, {
        documentsData,
        documentFiles,
        ficheId: fiche.id,
        basePath: path.dirname(fichePath),
      });

      await saveFilesToDisk({
        fichePath,
        ficheFile,
        documentPaths,
        documentFiles,
      });

      return { success: true, error: null };
    });
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

function buildFichePath(sourceName, dateGenerate, ficheName) {
  const formattedDateGenerate = format(dateGenerate, "yyyyMMdd");
  const { base: ficheBaseName, name } = path.parse(ficheName);
  return path.join(
    PATH_CONFIG.FICHES,
    sourceName,
    formattedDateGenerate,
    name,
    ficheBaseName
  );
}

function calculateFileHash(fileData) {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}

async function checkForDuplicateFiles(prisma, hash) {
  const existFiche = await prisma.fiche.findUnique({ where: { hash } });
  if (existFiche) {
    throw new Error("La fiche existe déjà.");
  }

  const existDocument = await prisma.document.findUnique({ where: { hash } });
  if (existDocument) {
    throw new Error("L'un des documents sources existe déjà.");
  }
}

const createFiche = async (
  prisma,
  { object, summary, dateGenerate, fichePath, hash, uploadId, dumpId }
) => {
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

  if (!fiche?.id) {
    throw new Error(
      "Échec de la création de la fiche : aucun identifiant retourné."
    );
  }

  return fiche;
};
