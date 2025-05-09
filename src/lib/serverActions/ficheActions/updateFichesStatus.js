"use server";

import prisma from "@/lib/db";
import { RoleBasedError } from "@/lib/classes";

export const updateFichesStatus = async (fichesToChange) => {
  const updatedFichesIds = [];

  try {
    await Promise.all(
      fichesToChange.map(async (fiche, index) => {
        await prisma.fiche
          .update({
            where: { id: fiche.id },
            data: { status: fiche.status },
          })
          .then(() => {
            updatedFichesIds.push(fiche.id);
          })
          .catch(() => {});
      })
    );

    if (updatedFichesIds.length === fichesToChange.length) {
      return {
        success: true,
        data: updatedFichesIds,
        message: "Les ressources ont été mises à jour avec succès.",
      };
    }
    if (updatedFichesIds.length === 0) {
      throw new RoleBasedError({
        0: `Impossible de mettre à jour les ressources sélectionnées.`,
        1: `Impossible de mettre à jour les ressources sélectionnées.\nSignaler ces ressources.`,
      });
    }
    if (updatedFichesIds.length < fichesToChange.length) {
      throw new RoleBasedError({
        0: `Impossible de mettre à jour certaines ressources sélectionnées.`,
        1: `Impossible de mettre à jour certaines ressources sélectionnées.\nSignaler ces ressources.`,
      });
    }
  } catch (error) {
    const role = "superAdmin";

    return {
      success: false,
      data: updatedFichesIds,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : "Erreur interne du serveur.",
    };
  }
};
