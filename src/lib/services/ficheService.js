import prisma from "@/lib/db";

export async function getFicheById(id) {
  return await prisma.fiche.findUnique({
    where: {
      id,
    },
    include: {
      dump: {
        include: {
          source: true,
        },
      },
      documents: true,
      ficheNers: {
        include: {
          ner: true,
        },
      },
      observations: {
        include: {
          observer: true,
        },
      },
      observedBy: {
        include: {
          observed: true,
        },
      },
    },
  });
}

export async function createFiche(data) {
  const {
    ref,
    object,
    synthesis,
    dateGenerate,
    name,
    extension,
    replacement,
    dumpId,
    uploadId,
  } = data;
  return await prisma.fiche.create({
    data: {
      ref,
      object,
      synthesis,
      dateGenerate,
      name,
      extension,
      replacement,
      dump: { connect: { id: dumpId } },
      upload: { connect: { id: uploadId } },
    },
    select: {
      id: true,
    },
  });
}
