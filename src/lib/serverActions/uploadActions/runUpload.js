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
    // Start processing
    await updateUploadById(uploadId, { status: "Processing" });

    // Check if the upload is validate
    const validationResult = await uploadValidation(uploadId);
    if (!validationResult.success) {
      await updateUploadById(uploadId, { status: "Failed" });
      return validationResult;
    }

    // Process products from upload
    const fileData = validationResult.data;
    const processResult = await processZipFile(fileData, uploadId);
    if (!processResult.success) {
      await updateUploadById(uploadId, { status: "Failed" });
      return processResult;
    }

    // Update upload status, and format it
    const upload = await updateUploadById(uploadId, { status: "Completed" });
    const formattedUpload = formatUpload(upload);
    return { success: true, data: formattedUpload, error: null };
  } catch (error) {
    await updateUploadById(uploadId, { status: "Failed" });
    return {
      success: false,
      data: null,
      error: { message: "Erreur interne du serveur" },
    };
  }
};

const uploadValidation = async (uploadId) => {
  try {
    const upload = await getUploadById(uploadId);
    if (!upload) {
      return {
        success: false,
        data: null,
        error: {
          message: `Aucun téléversement correspondant n'a été trouvé dans la base de données. Veuillez recharger la page ou réessayer plus tard.`,
        },
      };
    }
    if (!upload.path) {
      return {
        success: false,
        data: null,
        error: {
          message: `Le chemin d'accès au fichier téléversé est manquant. Cela peut indiquer que le traitement est toujours en cours ou que le fichier est incomplet. Veuillez patienter ou supprimer puis recréer le téléversement.`,
        },
      };
    }

    const absolutePath = path.join(FILE_STORAGE_PATH, upload.path);
    try {
      await fs.access(absolutePath, fs.constants.F_OK);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: `Le fichier lié au téléversement est introuvable à l'emplacement suivant : ${absolutePath}. Vérifiez qu'il n'a pas été déplacé ou supprimé manuellement.`,
        },
      };
    }

    try {
      const fileData = await fs.readFile(absolutePath);
      return { success: true, data: fileData, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: `Impossible de lire le fichier lié au téléversement à l'emplacement : ${absolutePath}. Il peut être corrompu ou inaccessible. Supprimez ce téléversement et ajoutez-en un nouveau.`,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: "Erreur interne du serveur.",
      },
    };
  }
};

const processZipFile = async (zipFileData, uploadId) => {
  try {
    const zip = await JSZip.loadAsync(zipFileData);
    const fileNames = Object.keys(zip.files).filter(
      (fileName) => !zip.files[fileName].dir
    );
    const folders = [...new Set(Object.keys(zip.files).map(path.dirname))];

    await Promise.all(
      folders.map(async (folder) => {
        try {
          await processFolder(zip, folder, fileNames, uploadId);
        } catch (error) {
          console.error(`Error processing folder ${folder}:`, error.message);
        }
      })
    );

    for (const folder of folders) {
      try {
        const fileNamesInFolder = fileNames.filter(
          (fileName) => !path.relative(folder, fileName).includes(path.sep)
        );

        try {
          const jsonName = fileNamesInFolder.find((fileName) =>
            fileName.endsWith("data.json")
          );
          const ficheName = fileNamesInFolder.find((fileName) =>
            isFiche(fileName)
          );
          const documentsNames = fileNamesInFolder.filter(
            (fileName) => isDocument(fileName) && fileName !== ficheName
          );
          if (jsonName && ficheName && documentsNames.length > 0) {
            const jsonData = await zip.file(jsonName).async("string");
            const ficheFile = Buffer.from(
              await zip.file(ficheName).async("arraybuffer")
            );
            const documentFiles = await Promise.all(
              documentsNames.map(async (fileName) =>
                Buffer.from(await zip.file(fileName).async("arraybuffer"))
              )
            );
            const result = await productTransaction({
              jsonData,
              ficheFile,
              ficheName,
              documentFiles,
              uploadId,
            });
            if (!result.success) {
              const message = result.error.message;
              await insertFailedFiche({
                jsonData,
                ficheFile,
                ficheName,
                documentFiles,
                documentsNames,
                message,
                uploadId,
              });
            }
          }
        } catch (error) {
          // should be removed
          console.log("Error in Fiche:", error.message);
        }

        try {
          const zipFileNames = fileNamesInFolder.filter((fileName) =>
            fileName.endsWith(".zip")
          );
          for (const zipFileName of zipFileNames) {
            const zipFile = await zip.file(zipFileName).async("arraybuffer");
            const result = await processZipFile(zipFile, uploadId);
            if (!result.success) {
              const message = result.error.message;
              await insertFailedFiche({
                zipFile,
                zipFileName,
                message,
                uploadId,
              });
            }
          }
        } catch (error) {}
      } catch (error) {}
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          "Le fichier semble corrompu ou illisible. Veuillez supprimer ce téléversement et réessayer avec un nouveau fichier.",
      },
    };
  }
};

async function processFolder(zip, folder, fileNames, uploadId) {
  const fileNamesInFolder = fileNames.filter(
    (fileName) => path.dirname(fileName) === folder
  );

  // Process product
  const jsonName = fileNamesInFolder.find((fileName) =>
    fileName.endsWith("data.json")
  );
  const ficheName = fileNamesInFolder.find(isFiche);
  const documentsNames = fileNamesInFolder.filter(
    (fileName) => isDocument(fileName) && fileName !== ficheName
  );

  if (jsonName && ficheName && documentsNames.length > 0) {
    await processProduct(zip, {
      jsonName,
      ficheName,
      documentsNames,
      uploadId,
    });
  }

  // Process nested zip files
  const zipFileNames = fileNamesInFolder.filter((fileName) =>
    fileName.endsWith(".zip")
  );
  await Promise.all(
    zipFileNames.map(async (zipFileName) => {
      try {
        const zipFile = await zip.file(zipFileName).async("arraybuffer");
        const result = await processZipFile(zipFile, uploadId);

        if (!result.success) {
          await insertFailedFiche({
            zipFile,
            zipFileName,
            message: result.error.message,
            uploadId,
          });
        }
      } catch (error) {
        console.error(
          `Error processing nested zip ${zipFileName}:`,
          error.message
        );
      }
    })
  );
}

const processProduct = async (data) => {
  const { jsonData, ficheFile, ficheName, documentFiles, uploadId } = data;

  try {
    return await prisma.$transaction(async (prisma) => {
      let dumpName,
        sourceName,
        dateCollect,
        summary,
        object,
        dateGenerate,
        documentsData;
      try {
        const jsonObject = JSON.parse(jsonData);

        dumpName = jsonObject.index;
        sourceName = jsonObject.source.name;
        dateCollect = new Date(jsonObject.source.date_collect);
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
      if (!dateCollect || isNaN(dateCollect.getTime())) {
        throw new Error(
          "La date de collecte du dump est manquant ou invalide dans data.json."
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
      const hash = calculateFileHash(ficheFile);
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
        const docHash = calculateFileHash(documentFiles[index]);
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
          await fs.writeFile(targetPath, ficheFile);
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
            await fs.writeFile(targetPath, documentFiles[index]);
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

      return { success: true, error: null };
    });
  } catch (error) {
    return { success: false, error: { message: error.message } };
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

const formatUpload = (upload) => {
  return {
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
};

const insertFailedFiche = async ({
  jsonData,
  ficheFile,
  ficheName,
  documentFiles,
  documentsNames,
  zipFile,
  zipFileName,
  message,
  uploadId,
}) => {
  try {
    const dateFolder = format(new Date(), "yyyyMMdd");
    const failedFichePath = path.join(
      FILE_STORAGE_PATH,
      "data",
      "Fiches échouées",
      dateFolder
    );

    await fs.mkdir(failedFichePath, { recursive: true });

    let filePath;

    if (zipFile) {
      filePath = path.join(failedFichePath, zipFileName);

      await fs.writeFile(filePath, zipFile);
    } else {
      const zip = new JSZip();

      if (jsonData) {
        zip.file("data.json", jsonData);
      }

      if (ficheFile && ficheName) {
        zip.file(path.parse(ficheName).base, ficheFile);
      }

      if (documentFiles && documentsNames) {
        documentFiles.forEach((file, index) => {
          const fileName = path.join(
            "Source",
            path.parse(documentsNames[index]).base
          );
          if (fileName) {
            zip.file(fileName, file);
          }
        });
      }

      const zipContent = await zip.generateAsync({ type: "nodebuffer" });

      filePath = path.join(
        failedFichePath,
        `${path.parse(ficheName).name}.zip`
      );
      await fs.writeFile(filePath, zipContent);
    }

    const failedFiche = await prisma.failedFiche.create({
      data: {
        dateGenerate: new Date(),
        path: filePath,
        fileName: zipFileName,
        message,
        uploadId,
      },
    });

    return { success: true, failedFiche };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
