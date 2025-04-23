import prisma from "@/lib/db";

export async function getDumpByName(name) {
  return await prisma.dump.findUnique({ where: { name } });
}

export async function createDump(data) {
  const { name, description, sourceId } = data;
  return await prisma.dump.create({
    data: {
      name,
      description,
      source: { connect: { id: sourceId } },
    },
    select: {
      id: true,
    },
  });
}
