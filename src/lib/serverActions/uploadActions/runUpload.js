"use server";

import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import crypto from "crypto";
import JSZip from "jszip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RoleBasedError } from "@/lib/classes";

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

    const fileDate = await uploadValidation(uploadId);

    await processZipFile(fileDate, uploadId);

    const upload = await updateUploadStatus(uploadId, "Completed");

    return {
      success: true,
      data: upload,
      message: "Ressource traitée avec succès.",
    };
  } catch (error) {
    const role = "superAdmin";
    const upload = await updateUploadStatus(uploadId, "Failed");
    return {
      success: false,
      data: upload,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : `Erreur interne du serveur.\n${error.message}`,
    };
  }
};

const updateUploadStatus = async (uploadId, status) => {
  const upload = await prisma.upload
    .update({
      where: { id: uploadId },
      data: { status },
      include: {
        user: true,
        fiches: {
          include: {
            source: true,
          },
        },
        failedFiches: true,
      },
    })
    .catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la mise à jour du statut du téléversement vers '${status}'.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
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
    let upload, absolutePath;

    upload = await prisma.upload
      .findUnique({ where: { id: uploadId } })
      .then((upload) => {
        if (!upload) {
          throw new RoleBasedError({
            1: `Ressource introuvable dans la base de données. Veuillez rafraîchir la page.`,
          });
        }
        if (!upload.path) {
          throw new RoleBasedError({
            0: `Ressource sans chemin d'accès.\nVeuillez Supprimer et ajouter une nouvelle ressource.`,
            1: `Ressource sans chemin d'accès.\nVeuillez Supprimer et ajouter une nouvelle ressource, ou signaler la ressource.`,
          });
        }
        return upload;
      })
      .catch((error) => {
        if (error instanceof RoleBasedError) throw error;
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la collecte du ressource pour le valider.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    absolutePath = path.join(FILE_STORAGE_PATH, upload.path);
    await fs.access(absolutePath, fs.constants.F_OK).catch(() => {
      throw new RoleBasedError({
        0: `Ressource introuvable dans le système de fichiers dans ${absolutePath}. Vérifiez qu'il n'a pas été déplacé ou supprimé manuellement, ou utiliser le mode forcé.`,
        0: `Ressource introuvable dans le système de fichiers.\nSignaler la ressource.`,
      });
    });

    const fileData = await fs.readFile(absolutePath).catch(() => {
      throw new RoleBasedError({
        0: `Erreur lors de la lecture du fichier lié à la ressource à l'emplacement : ${absolutePath}. Il peut être corrompu. Supprimez la ressource et ajoutez-en une nouvelle.`,
        1: `Erreur lors de la lecture du fichier lié à la ressource.\nSupprimez la ressource et ajoutez-en une nouvelle.`,
      });
    });
    return fileData;
  } catch (error) {
    if (error instanceof RoleBasedError) throw error;
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la validation de la ressource.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};

const processZipFile = async (zipFileData, uploadId) => {
  try {
    let zipFile, fileNames, folders;

    zipFile = await JSZip.loadAsync(zipFileData)
      .then((zip) => {
        if (!zip) throw "L'objet zip est vide.";
        return zip;
      })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur lors de la lecture du fichier lié à la ressource. Il peut être corrompu ou n'est pas un fichier zip valide.\n${error.message}`,
          1: `Erreur lors de la lecture du fichier lié à la ressource. Il peut être corrompu ou n'est pas un fichier zip valide.`,
        });
      });
    fileNames = Object.keys(zipFile.files).filter(
      (fileName) => !zipFile.files[fileName].dir
    );
    folders = [...new Set(Object.keys(zipFile.files).map(path.dirname))];

    await Promise.all(
      folders.map(async (folder) => {
        await processFolder(zipFile, fileNames, folder, uploadId);
      })
    );
  } catch (error) {
    if (error instanceof RoleBasedError) throw error;
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la traitement du fichier lié à la ressource.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};

const processFolder = async (zipFile, fileNames, folder, uploadId) => {
  try {
    const fileNamesInFolder = fileNames.filter(
      (fileName) =>
        path.dirname(fileName) === folder ||
        path.dirname(fileName) === path.join(folder, "Source")
    );

    // Process products
    await processProduct(zipFile, fileNamesInFolder, uploadId);

    // Process nested zip files
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
    ).catch(() => {});
  } catch {}
};

const processProduct = async (zipFile, fileNamesInFolder, uploadId) => {
  try {
    const jsonName = fileNamesInFolder.find((fileName) =>
      fileName.endsWith("data.json")
    );
    const ficheName = fileNamesInFolder.find(isFiche);
    const documentsNames = fileNamesInFolder.filter(
      (fileName) => isDocument(fileName) && fileName !== ficheName
    );
    const originalDocumentsNames = fileNamesInFolder.filter((fileName) =>
      path.dirname(fileName).endsWith("/Source")
    );

    documentsNames.sort();
    originalDocumentsNames.sort();

    if (
      !jsonName ||
      !ficheName ||
      documentsNames.length === 0 ||
      originalDocumentsNames.length === 0
    ) {
      throw new Error("produit mal structuré");
    }

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
    const originalDocumentsData = await Promise.all(
      originalDocumentsNames.map((fileName) =>
        zipFile
          .file(fileName)
          .async("arraybuffer")
          .then((buf) => Buffer.from(buf))
      )
    );

    const jsonValidationResult = await jsonValidation(
      jsonData,
      documentsData.length
    );
    if (!jsonValidationResult.success) {
      await insertFailedFiche({
        jsonData,
        ficheData,
        ficheName,
        documentsData,
        documentsNames,
        originalDocumentsData,
        originalDocumentsNames,
        message: jsonValidationResult.message,
        uploadId,
      });
      throw new Error(jsonValidationResult.message);
    }

    const validateJsonData = jsonValidationResult.data;
    const transactionResult = await productTransaction(
      validateJsonData,
      ficheName,
      ficheData,
      documentsData,
      originalDocumentsData,
      uploadId
    );
    if (!transactionResult.success) {
      await insertFailedFiche({
        jsonData,
        ficheData,
        ficheName,
        documentsData,
        documentsNames,
        originalDocumentsData,
        originalDocumentsNames,
        message: transactionResult.message,
        uploadId,
      });
      throw new Error(transactionResult.message);
    }
  } catch (error) {
    console.error(`Error processing product: ${error.message}`);
  }
};

const jsonValidation = async (jsonData, documentsDataLength) => {
  try {
    let dump, sourceName, dateCollect, summary, object, date, documentsInfo;
    try {
      const jsonObject = JSON.parse(jsonData);

      dump = jsonObject.index;
      sourceName = jsonObject.source.name;
      dateCollect = new Date(jsonObject.source.date_collect);
      summary = jsonObject.summary;
      object = jsonObject.object;
      date = new Date(jsonObject.date_generate);
      documentsInfo = jsonObject.files.map((file) => ({
        type: file.type,
        fileName: file.name.filename,
        originalFileName: file.original.filename,
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
    let source;
    try {
      source = await prisma.source.findUnique({
        where: { name: sourceName },
      });
    } catch {
      throw new Error(
        `Erreur lors de la recherche de la source '${sourceName}' dans la base de données : ${error.message}`
      );
    }
    if (!source || !source.id) {
      throw new Error(
        `La source '${sourceName}' est introuvable dans la base de données`
      );
    }
    const sourceId = source.id;
    if (!date || isNaN(date.getTime())) {
      throw new Error(
        "La date de génération est manquant ou invalide dans data.json"
      );
    }
    if (!dateCollect || isNaN(dateCollect.getTime())) {
      throw new Error(
        "La date de collecte du dump est manquant ou invalide dans data.json"
      );
    }

    const data = {
      dump,
      sourceId,
      sourceName,
      summary,
      object,
      date,
      documentsInfo,
    };
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const productTransaction = async (
  validateJsonData,
  ficheName,
  ficheData,
  documentsData,
  originalDocumentsData,
  uploadId
) => {
  try {
    const { dump, sourceId, sourceName, summary, object, date, documentsInfo } =
      validateJsonData;
    return await prisma.$transaction(async (prisma) => {
      let fichePath, hash;
      try {
        fichePath = buildFichePath(sourceName, date, ficheName);
      } catch {
        throw new Error(`Erreur lors de la construction du chemin de la fiche`);
      }
      try {
        hash = calculateFileHash(ficheData);
      } catch {
        throw new Error(`Erreur lors du calcul du hash de la fiche`);
      }
      if (!hash) {
        throw new Error("Le hash de la fiche est manquant ou invalide");
      }

      await checkForDuplicateFiles(prisma, hash, "fiche");

      const fiche = await createFiche(prisma, {
        object,
        summary,
        date,
        fichePath,
        hash,
        uploadId,
        sourceId,
        dump,
      });

      const documentPaths = await processDocuments(prisma, {
        documentsInfo,
        documentsData,
        ficheId: fiche.id,
        basePath: path.dirname(fichePath),
      });

      await saveFilesToDisk({
        fichePath,
        ficheData,
        documentPaths,
        documentsData,
        originalDocumentsData,
      });

      return { success: true, message: "Done" };
    });
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const buildFichePath = (sourceName, date, ficheName) => {
  const formattedDate = format(date, "yyyyMMdd");
  const { base: ficheBaseName, name } = path.parse(ficheName);
  return path.join(
    PATH_CONFIG.FICHES,
    sourceName,
    formattedDate,
    name,
    ficheBaseName
  );
};

const calculateFileHash = (fileData) => {
  return crypto.createHash("sha256").update(fileData).digest("hex");
};

const checkForDuplicateFiles = async (prisma, hash, docType) => {
  if (docType === "fiche") {
    let existFiche;
    try {
      existFiche = await prisma.fiche.findUnique({ where: { hash } });
    } catch {
      throw new Error(
        "Erreur lors de la vérification de la duplication de la fiche dans la base de données"
      );
    }
    if (existFiche) {
      throw new Error("La fiche existe déjà");
    }
  } else if (docType === "document") {
    let existDocument = await prisma.document.findUnique({ where: { hash } });
    try {
      existDocument = await prisma.document.findUnique({ where: { hash } });
    } catch {
      throw new Error(
        "Erreur lors de la vérification de la duplication du document source dans la base de données"
      );
    }
    if (existDocument) {
      throw new Error("L'un des documents sources existe déjà");
    }
  }
};

const createFiche = async (prisma, data) => {
  try {
    const { object, summary, date, fichePath, hash, uploadId, sourceId, dump } =
      data;
    const ref = "ABC-" + Math.floor(100 + Math.random() * 900);
    const fiche = await prisma.fiche.create({
      data: {
        ref,
        object,
        summary,
        date,
        path: fichePath,
        hash,
        dump: dump,
        upload: { connect: { id: uploadId } },
        source: { connect: { id: sourceId } },
      },
    });

    if (!fiche?.id) throw new Error();

    return fiche;
  } catch {
    throw new Error(
      "Échec de la création de la fiche : aucun identifiant retourné"
    );
  }
};

const processDocuments = async (prisma, data) => {
  const { documentsInfo, documentsData, ficheId, basePath } = data;
  const documentPaths = [];

  await Promise.all(
    documentsInfo.map(async (doc, index) => {
      try {
        const docExt = path.extname(doc.fileName);
        const originalExt = path.extname(doc.originalFileName);

        // const docPath = path.join(basePath)

        // insert documents and original documents

        const docBaseName = path.parse(doc.fileName).base;
        const docPath = path.join(basePath, PATH_CONFIG.SOURCE, docBaseName);
        documentPaths.push(docPath);

        let docHash;
        try {
          docHash = calculateFileHash(documentsData[index]);
        } catch {
          throw new Error("Erreur lors du calcul du hash du document source");
        }

        await checkForDuplicateFiles(prisma, docHash, "document");

        try {
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
        } catch {
          throw new Error(
            "Erreur lors de la création du document source dans la base de données"
          );
        }
      } catch (error) {
        throw new Error(error.message);
      }
    })
  );

  return documentPaths;
};

const saveFilesToDisk = async ({
  fichePath,
  ficheData,
  documentPaths,
  documentsData,
}) => {
  const addedPaths = [];

  try {
    const ficheTargetPath = path.join(FILE_STORAGE_PATH, fichePath);
    await fs.mkdir(path.dirname(ficheTargetPath), { recursive: true });
    await fs.writeFile(ficheTargetPath, ficheData);
    addedPaths.push(ficheTargetPath);

    await Promise.all(
      documentPaths.map(async (docPath, index) => {
        const targetPath = path.join(FILE_STORAGE_PATH, docPath);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, documentsData[index]);
        addedPaths.push(targetPath);
      })
    );
  } catch (error) {
    await Promise.all(
      addedPaths.map((path) => fs.unlink(path).catch(() => {}))
    );
    throw new Error("Échec d'enregistrement des fichiers sur le disque");
  }
};

const insertFailedFiche = async ({
  jsonData,
  ficheData,
  ficheName,
  documentsData,
  documentsNames,
  message,
  uploadId,
}) => {
  try {
    if (!ficheName) {
      throw new Error("Le nom de la fiche est requis");
    }

    const dateFolder = format(new Date(), "yyyyMMdd");
    const filePath = path.join(
      PATH_CONFIG.FAILED,
      dateFolder,
      uploadId,
      `${path.parse(ficheName).name}.zip`
    );
    const absolutePath = path.join(FILE_STORAGE_PATH, filePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    const zip = new JSZip();

    if (jsonData) {
      zip.file("data.json", jsonData);
    }

    if (ficheData && ficheName) {
      zip.file(path.parse(ficheName).base, ficheData);
    }

    if (documentsData && documentsNames && documentsData.length > 0) {
      for (let i = 0; i < documentsData.length; i++) {
        if (i >= documentsNames.length) break;
        const fileName = path.join(
          PATH_CONFIG.SOURCE,
          path.parse(documentsNames[i]).base
        );

        zip.file(fileName, documentsData[i]);
      }
    }

    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      streamFiles: true,
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    await fs.writeFile(absolutePath, zipContent);

    await prisma.failedFiche.create({
      data: {
        date: new Date(),
        path: filePath,
        message: message,
        upload: { connect: { id: uploadId } },
      },
    });
  } catch (error) {
    console.error("Error saving failed fiche", error.message);
  }
};

const isFiche = (fileName) => {
  return FILE_TYPES.FICHE.some((ext) => fileName.endsWith(ext));
};

const isDocument = (fileName) => {
  return FILE_TYPES.DOCUMENT.some((ext) => fileName.endsWith(ext));
};
