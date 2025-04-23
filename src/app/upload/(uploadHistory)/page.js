import UploadHistory from "@/components/upload/UploadHistory";
import { getUploadsByUserId } from "@/lib/services/uploadService";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const page = async () => {
  const userId = "3020e7e1-873b-48bb-8b91-8159a0d88c0f";

  const uploads = await getUploadsByUserId(userId);
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
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  }));

  return <UploadHistory uploadsData={formattedUploads} />;
};

export default page;
