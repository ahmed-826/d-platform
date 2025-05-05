"use server";

import prisma from "@/lib/db";

export const changeFicheStatus = async (changes) => {
  const updatedFichesIds = [];
  let failedUpdating = false;

  for (const change of changes) {
    try {
      await prisma.fiche.update({
        where: { id: change.id },
        data: { status: change.status },
      });
      updatedFichesIds.push(change.id);
    } catch (error) {
      console.log(error.message);
      failedUpdating = true;
    }
  }

  return { updatedFichesIds, failedUpdating };
};
