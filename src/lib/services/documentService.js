import prisma from "@/lib/db";

export async function createDocument(data) {
  const { name, type, content, meta, extension, replacement, ficheId } = data;
  return await prisma.document.create({
    data: {
      name,
      type,
      content,
      meta,
      extension,
      replacement,
      fiche: { connect: { id: ficheId } },
    },
    select: {
      id: true,
    },
  });
}
