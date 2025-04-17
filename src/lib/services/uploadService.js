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

export async function createUpload(data) {
  const { name, userId, type, path } = data;
  return await prisma.upload.create({
    data: {
      name,
      type,
      path,
      user: { connect: { id: userId } },
    },
    include: {
      select: { id: true },
    },
  });
}
