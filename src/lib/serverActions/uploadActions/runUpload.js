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

    const zipFileData = await uploadValidation(uploadId);

    const precessResult = await processZipFile(zipFileData, uploadId);
    if (!precessResult.success) {
      await updateUploadStatus(uploadId, "Failed");
      return precessResult;
    }

    const upload = await completedUpload(uploadId);
    return { success: true, data: upload, error: null };
  } catch (error) {
    const role = "superAdmin";
    await updateUploadStatus(uploadId, "Failed").catch((error) => {
      error = new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la mise à jour du statut du téléversement vers 'Failed' : ${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });
    return {
      success: false,
      error: {
        message:
          error instanceof RoleBasedError
            ? error.getMessage(role)
            : `Erreur interne du serveur`,
      },
    };
  }
};

const updateUploadStatus = async (uploadId, status) => {
  await prisma.upload
    .update({ where: { id: uploadId }, data: { status } })
    .catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la mise à jour du statut du téléversement : ${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });
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
    let upload, absolutePath;

    upload = await prisma.upload
      .findUnique({ where: { id: uploadId } })
      .then((upload) => {
        if (!upload) {
          throw new RoleBasedError({
            0: `Aucune ressource n'a été trouvé dans la base de données. Veuillez rafraîchir la page.`,
            1: `Aucune ressource n'a été trouvé. Veuillez rafraîchir la page.`,
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
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la collecte du téléversement pour le valider.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    try {
      absolutePath = path.join(FILE_STORAGE_PATH, upload.path);
      await fs.access(absolutePath, fs.constants.F_OK);
    } catch {
      throw new Error(
        `Le fichier lié au téléversement est introuvable à l'emplacement suivant : ${absolutePath}. Vérifiez qu'il n'a pas été déplacé ou supprimé manuellement.`
      );
    }

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

    // Process products
    await processProduct(zipFile, fileNamesInFolder, uploadId);

    // Process nested zip files
    const zipFileNames = fileNamesInFolder.filter((fileName) =>
      fileName.endsWith(".zip")
    );
    await Promise.all(
      zipFileNames.map(async (zipFileName) => {
        try {
          const nestedZipFile = await zipFile
            .file(zipFileName)
            .async("arraybuffer");
          const precessResult = await processZipFile(nestedZipFile, uploadId);
          if (!precessResult.success) {
            throw new Error(precessResult.error.message);
          }
        } catch (error) {
          console.error(
            `Erreur lors de la lecture du fichier zip imbriqué ${zipFileName}: ${error.message}`
          );
        }
      })
    );
  } catch (error) {}
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
    if (!jsonName || !ficheName || documentsNames.length === 0) {
      throw new Error("Le produit est incomplet ou mal structuré");
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
        message: jsonValidationResult.error.message,
        uploadId,
      });
      throw new Error(jsonValidationResult.error.message);
    }

    const validateJsonData = jsonValidationResult.data;
    const transactionResult = await productTransaction(
      validateJsonData,
      ficheName,
      ficheData,
      documentsData,
      uploadId
    );
    if (!transactionResult.success) {
      await insertFailedFiche({
        jsonData,
        ficheData,
        ficheName,
        documentsData,
        documentsNames,
        message: transactionResult.error.message,
        uploadId,
      });
      throw new Error(transactionResult.error.message);
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
    try {
      dump = await prisma.dump.findUnique({
        where: { name: dumpName },
      });
    } catch {
      throw new Error(
        `Erreur lors de la recherche du dump '${dumpName}' dans la base de données : ${error.message}`
      );
    }

    if (!dump) {
      try {
        dump = await prisma.dump.create({
          data: {
            name: dumpName,
            dateCollect,
            source: { connect: { id: source.id } },
          },
        });
      } catch {
        throw new Error(
          `Erreur lors de la création du dump '${dumpName}' dans la base de données : ${error.message}`
        );
      }
      if (!dump || !dump.id) {
        throw new Error(
          `Échec de la création du dump avec le nom '${dumpName}'`
        );
      }
    }
    const dumpId = dump.id;
    const data = {
      dumpId,
      sourceName,
      summary,
      object,
      dateGenerate,
      documentsInfo,
    };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const productTransaction = async (
  validateJsonData,
  ficheName,
  ficheData,
  documentsData,
  uploadId
) => {
  try {
    const { dumpId, sourceName, summary, object, dateGenerate, documentsInfo } =
      validateJsonData;
    return await prisma.$transaction(async (prisma) => {
      let fichePath, hash;
      try {
        fichePath = buildFichePath(sourceName, dateGenerate, ficheName);
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
        dateGenerate,
        fichePath,
        hash,
        uploadId,
        dumpId,
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
      });

      return { success: true, error: null };
    });
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const buildFichePath = (sourceName, dateGenerate, ficheName) => {
  const formattedDateGenerate = format(dateGenerate, "yyyyMMdd");
  const { base: ficheBaseName, name } = path.parse(ficheName);
  return path.join(
    PATH_CONFIG.FICHES,
    sourceName,
    formattedDateGenerate,
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
    const { object, summary, dateGenerate, fichePath, hash, uploadId, dumpId } =
      data;
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
        dateGenerate: new Date(),
        path: filePath,
        message: message,
        upload: { connect: { id: uploadId } },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving failed fiche", error.message);
    return { success: false, error: error.message };
  }
};

const isFiche = (fileName) => {
  return FILE_TYPES.FICHE.some((ext) => fileName.endsWith(ext));
};

const isDocument = (fileName) => {
  return FILE_TYPES.DOCUMENT.some((ext) => fileName.endsWith(ext));
};
