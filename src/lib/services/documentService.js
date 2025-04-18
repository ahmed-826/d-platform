import prisma from "@/lib/db";

export async function getDocumentByHash(hash) {
  return await prisma.document.findUnique({
    where: { hash },
  });
}

export async function createDocument(data) {
  const { name, type, content, meta, extension, replacement, hash, ficheId } =
    data;
  return await prisma.document.create({
    data: {
      name,
      type,
      content,
      meta,
      extension,
      replacement,
      hash,
      fiche: { connect: { id: ficheId } },
    },
    select: {
      id: true,
    },
  });
}
