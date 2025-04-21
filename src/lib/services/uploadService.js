import prisma from "@/lib/db";

export async function getUploadById(uploadId) {
  return await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      user: true,
      fiches: {
        include: {
          dump: {
            include: {
              source: true,
            },
          },
        },
      },
      failedFiches: true,
    },
  });
}

export async function getUploadByIdAndUserId(uploadId, userId) {
  return await prisma.upload.findUnique({
    where: { id: uploadId, userId },
    include: {
      user: true,
      fiches: {
        include: {
          dump: {
            include: {
              source: true,
            },
          },
        },
      },
      failedFiches: true,
    },
  });
}

export async function getUploadsByUserId(userId) {
  return await prisma.upload.findMany({
    where: { userId },
    include: {
      user: true,
      fiches: {
        include: {
          dump: {
            include: {
              source: true,
            },
          },
        },
      },
      failedFiches: true,
    },
  });
}

export async function getUploadByHash(hash) {
  return await prisma.upload.findUnique({
    where: { hash },
  });
}

export async function createUpload(data) {
  const { name, type, hash, userId } = data;
  return await prisma.upload.create({
    data: {
      name,
      type,
      hash,
      user: { connect: { id: userId } },
    },
    select: { id: true },
  });
}

export async function updateUploadById(id, data) {
  return await prisma.upload.update({
    where: { id },
    data: { ...data },
  });
}
