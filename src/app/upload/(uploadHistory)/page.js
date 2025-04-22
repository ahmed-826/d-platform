import UploadHistory from "@/components/upload/UploadHistory";
import { getUploadsByUserId } from "@/lib/services/uploadService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const page = async () => {
  const userId = "b60ed9a6-4e75-4149-952a-c0c3d35ac057";

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
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  }));

  return <UploadHistory uploadsData={formattedUploads} />;
};

export default page;
