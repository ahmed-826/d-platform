import UploadHistory from "@/components/upload/UploadHistory";

import { getUploadsByUserId } from "@/lib/services/uploadService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const page = async () => {
  const userId = "1025a3bb-7349-4d5b-ae5f-85d448dbe67f";

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
    absolutePath: FILE_STORAGE_PATH + upload.path,
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  }));

  return <UploadHistory uploads={formattedUploads} />;
};

export default page;
