import prisma from "@/lib/db";

export async function getSourceByName(name) {
  return await prisma.source.findUnique({
    where: { name },

    select: {
      id: true,
    },
  });
}
