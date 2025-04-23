import ConsultUpload from "@/components/upload/ConsultUpload";

import { getUploadByIdAndUserId } from "@/lib/services/uploadService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const page = async ({ params }) => {
  const { uploadId } = params;
  const userId = "8e60d485-9a29-4156-bcf9-9066ca673571";

  const upload = await getUploadByIdAndUserId(uploadId, userId);

  const formattedUpload = {
    id: upload.id,
    name: upload.name,
    date: format(upload.date, "dd MMMM yyyy 'à' HH:mm:ss", {
      locale: fr,
    }),
    username: upload.user.username,
    type: upload.type,
    fileName: upload.fileName,
    successfulFiches: upload.fiches.map((fiche) => ({
      id: fiche.id,
      ref: fiche.ref,
      source: fiche.dump.source.name,
      uploadStatus: { status: "successful", message: "Upload successful" },
      status: fiche.status,
    })),
    failedFiches: upload.failedFiches.map((fiche) => ({
      id: fiche.id,
      source: fiche.source,
      uploadStatus: { status: "failed", message: fiche.message },
      status: fiche.status,
    })),
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  };

  return <ConsultUpload upload={formattedUpload} />;
};

export default page;
