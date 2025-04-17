import ConsultUpload from "@/components/upload/ConsultUpload";

import { getUploadByIdAndUserId } from "@/lib/services/uploadService";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const page = async ({ params }) => {
  const { uploadId } = params;
  const userId = "1025a3bb-7349-4d5b-ae5f-85d448dbe67f";

  const upload = await getUploadByIdAndUserId(uploadId, userId);

  const formattedUpload = {
    id: upload.id,
    name: upload.name,
    date: format(upload.date, "dd MMMM yyyy 'à' HH:mm:ss", {
      locale: fr,
    }),
    username: upload.user.username,
    type: upload.type,
    fileName: path.basename(upload.path),
    path: upload.path,
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
