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
    object,
    synthesis,
    dateGenerate = new Date(),
    name,
    extension,
    replacement,
    dumpId,
    uploadId,
  } = data;
  const ref = "Fiche-" + Math.floor(Math.random() * 1000000);
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
