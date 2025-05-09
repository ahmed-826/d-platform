import UploadHistory from "@/components/upload/UploadHistory";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import prisma from "@/lib/db";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const page = async () => {
  const userId = "a59cd394-5f14-42e0-b559-e6f9e0fee105";

  const uploads = await prisma.upload.findMany({
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
    orderBy: {
      date: "desc",
    },
  });
  const formattedUploads = uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    status: upload.status,
    date: format(upload.date, "dd MMMM yyyy 'à' HH:mm:ss", {
      locale: fr,
    }),
    user: upload.user.username,
    type: upload.type,
    path: path.join(FILE_STORAGE_PATH, upload.path),
    fileName: upload.fileName,
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  }));

  return <UploadHistory uploadsData={formattedUploads} />;
};

export default page;
