import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RoleBasedError } from "@/lib/classes";
import { calculateFileHash } from "@/lib/utils";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;
const uploadDir = path.join("data", "upload");

// POST Functions
const formDataValidation = (formData) => {
  const type = formData.get("type");
  const userId = formData.get("userId");

  if (!type) {
    throw new RoleBasedError({
      0: `Mauvaise requête.\nType de téléversement est manquant.`,
      1: `Mauvaise requête.\nContacter le Super administrateur.`,
    });
  }
  if (!userId) {
    throw new RoleBasedError({
      0: `Mauvaise requête.\nID utilisateur est manquant.`,
      1: `Mauvaise requête.\nContacter le Super administrateur.`,
    });
  }
  if (!["Form", "File", "API"].includes(type)) {
    throw new RoleBasedError({
      0: `Mauvaise requête.\nType de téléversement fourni est invalide : '${type}'. Les types acceptés sont : 'Form', 'File' ou 'API'.`,
      1: `Mauvaise requête.\nContacter le Super administrateur.`,
    });
  }
  if (["File", "API"].includes(type)) {
    const zipFile = formData.get("file");
    if (!zipFile) {
      throw new RoleBasedError({ 1: `Fichier est manquant.` });
    }
    if (
      zipFile.type !== "application/zip" &&
      zipFile.type !== "application/x-zip-compressed"
    ) {
      throw new RoleBasedError({
        1: `Fichier fourni doit être un fichier ZIP valide (format .zip).`,
      });
    }
  }
  if (type === "Form") {
    const source = formData.get("source");
    const object = formData.get("object");
    const summary = formData.get("summary");
    const documents = formData.getAll("documents");
    if (!source) {
      throw new RoleBasedError({ 1: `Source est manquante.` });
    }
    if (!object) {
      throw new RoleBasedError({ 1: `Objet est manquant.` });
    }
    if (!summary) {
      throw new RoleBasedError({ 1: `Synthèse est manquante.` });
    }
    if (documents.length === 0) {
      throw new RoleBasedError({ 1: `Documents sources sont manquantes.` });
    }
  }
};

const uploadByFileOrAPI = async (formData) => {
  const type = formData.get("type");
  if (!["File", "API"].includes(type)) return;

  const userId = formData.get("userId");
  const zipFile = formData.get("file");

  const { fileData, hash } = await existenceValidation(zipFile);

  const date = new Date();
  const formattedDate = format(date, "yyyyMMdd");
  const rank = await getUploadRank(date);

  const fileName = zipFile.name;
  const name = `${format(date, "ddMMMMyyyy", {
    locale: fr,
  })}-${type}-${rank}`;
  const relativePath = path.join(
    uploadDir,
    formattedDate,
    `${rank} - ${type} - ${fileName}`
  );
  await prisma.$transaction(async (prisma) => {
    await prisma.upload
      .create({
        data: {
          name,
          type,
          hash,
          fileName,
          path: relativePath,
          user: { connect: { id: userId } },
        },
      })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la création du téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    const absolutePath = path.join(FILE_STORAGE_PATH, relativePath);
    const dirPath = path.dirname(absolutePath);
    await fs.mkdir(dirPath, { recursive: true }).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de la création du répertoire du téléversement.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });
    await fs.writeFile(absolutePath, fileData).catch((error) => {
      throw new RoleBasedError({
        0: `Erreur interne du serveur, au niveau du système de fichiers.\nErreur lors de l'écriture du fichier du téléversement.\n${error.message}`,
        1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
      });
    });
  });
};

const uploadByForm = async (formData) => {
  const type = formData.get("type");
  if (type === "Form") return;

  const userId = formData.get("userId");
  const source = formData.get("source");
  const object = formData.get("object");
  const summary = formData.get("summary");
  const documents = formData.getAll("documents");
  const date = new Date();
  const formattedDate = format(date, "yyyyMMdd");
  let dump = formData.get("dump");
  if (!dump) {
    dump = `files_${source}-${formattedDate}_dp`;
  }
  const jsonData = {
    index: dump,
    summary,
    object,
    date_generate: date,
    source: { name: source, date_collect: date },
    files: documents.map((document) => ({
      type: document.type,
      original: {
        filename: document.name,
      },
      name: {
        filename: document.name,
      },
    })),
  };

  const rank = await getUploadRank(date);
  const fileName = `Formulaire-${source}_${formattedDate}`;
  const name = `${format(date, "ddMMMMyyyy", {
    locale: fr,
  })}-${type}-${rank}`;
  const uploadPath = path.join(
    "data",
    "uploads",
    formattedDate,
    `${rank} - ${type} - ${fileName}`
  );

  await prisma.$transaction(async (prisma) => {
    await prisma.upload
      .create({
        data: {
          name,
          type,
          hash,
          fileName,
          path: uploadPath,
          user: { connect: { id: userId } },
        },
      })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la création du téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });
  });
};

// helper functions
const existenceValidation = async (zipFile) => {
  try {
    const fileData = Buffer.from(await zipFile.arrayBuffer());
    const hash = calculateFileHash(fileData);

    await prisma.upload
      .findUnique({ where: { hash } })
      .then((upload) => {
        if (upload) {
          throw new RoleBasedError({
            1: `Le fichier a été déjà téléversé.\nVeuillez utiliser un autre fichier.`,
          });
        }
      })
      .catch((error) => {
        if (error instanceof RoleBasedError) {
          throw error;
        }
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la validation de l'existence du fichier.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    return { fileData, hash };
  } catch (error) {
    if (error instanceof RoleBasedError) {
      throw error;
    }
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la validation de l'existence du fichier.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};

const getUploadRank = async (date) => {
  try {
    const formattedDate = format(date, "yyyyMMdd");
    const startsWith = path
      .join("data", "uploads", formattedDate)
      .replace(/\\/g, "\\\\");

    const previousRank = await prisma.upload
      .count({
        where: {
          path: { startsWith },
        },
      })
      .catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\nErreur lors de la récupération du rang du téléversement.\n${error.message}`,
          1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
        });
      });

    return previousRank + 1;
  } catch (error) {
    if (error instanceof RoleBasedError) {
      throw error;
    }
    throw new RoleBasedError({
      0: `Erreur interne du serveur.\nErreur lors de la récupération du rang de téléversement.\n${error.message}`,
      1: `Erreur interne du serveur.\nContacter le Super administrateur.`,
    });
  }
};

export { formDataValidation, uploadByFileOrAPI, uploadByForm };
