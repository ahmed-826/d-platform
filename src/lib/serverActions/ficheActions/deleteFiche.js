"use server";

import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { RoleBasedError } from "@/lib/classes";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export const deleteFiche = async (id) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      let fiche, folderPath;

      fiche = await prisma.fiche.delete({ where: { id } }).catch((error) => {
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau de la base de données.\n${error.message}`,
          1: `Erreur interne du serveur, au niveau de la base de données.`,
        });
      });
      if (!fiche) {
        throw new RoleBasedError({
          0: `Ressource introuvable dans la base de données.\nVeuillez rafraîchir la page.`,
          1: `Ressource introuvable dans la base de données.\nVeuillez rafraîchir la page.`,
        });
      }
      if (!fiche?.path) {
        throw new RoleBasedError({
          0: `Ressource incomplète (le chemin d'accès est manquant).\nVeuillez utiliser le mode forcé.`,
          1: `Ressource incomplète (le chemin d'accès est manquant).\nVeuillez signaler cette resource.`,
        });
      }

      folderPath = path.join(FILE_STORAGE_PATH, path.dirname(fiche.path));
      await fs.rm(folderPath, { recursive: true }).catch((error) => {
        if (error.code === "ENOENT") {
          throw new RoleBasedError({
            0: `Ressource introuvable dans le système de fichiers.\nVeuillez utiliser le mode forcé.\n${error.message}`,
            1: `Ressource introuvable dans le système de fichiers.\nVeuillez signaler cette resource.`,
          });
        }
        throw new RoleBasedError({
          0: `Erreur interne du serveur, au niveau du système de fichiers.\n${error.message}`,
          1: `Erreur interne du serveur, au niveau du système de fichiers.\nVeuillez signaler cette resource.`,
        });
      });

      await fs.rmdir(path.dirname(folderPath)).catch(() => {});

      return {
        success: true,
        data: fiche.id,
        message: "La ressource a été supprimé avec succès.",
      };
    });
  } catch (error) {
    const role = "superAdmin";

    return {
      success: false,
      data: null,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : "Erreur interne du serveur.",
    };
  }
};

export const deleteMultipleFiches = async (ids) => {
  const deletedFichesIds = [];
  try {
    await Promise.all(
      ids.map(async (id) => {
        const { success, data: deletedFicheId } = await deleteFiche(id);
        if (success) deletedFichesIds.push(deletedFicheId);
      })
    );

    if (deletedFichesIds.length === ids.length) {
      return {
        success: true,
        data: deletedFichesIds,
        message: "Les ressources ont été supprimé avec succès.",
      };
    }
    if (deletedFichesIds.length === 0) {
      throw new RoleBasedError({
        0: `Impossible de supprimer les ressources sélectionnées.\nSupprimez-les un par un pour voir l'erreur.`,
        1: `Impossible de supprimer les ressources sélectionnées.\nSignaler ces ressources.`,
      });
    }
    if (deletedFichesIds.length < ids.length) {
      throw new RoleBasedError({
        0: `Impossible de supprimer certaines ressources sélectionnées.\nSupprimez-les un par un pour voir l'erreur.`,
        1: `Impossible de supprimer certaines ressources sélectionnées.\nSignaler ces ressources.`,
      });
    }

    return {
      success: false,
      data: deletedFichesIds,
      message: "Erreur interne du serveur.",
    };
  } catch (error) {
    const role = "superAdmin";

    return {
      success: false,
      data: deletedFichesIds,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : "Erreur interne du serveur.",
    };
  }
};
