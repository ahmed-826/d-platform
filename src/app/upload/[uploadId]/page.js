import ConsultUpload from "@/components/upload/ConsultUpload";
import { getUploadByIdAndUserId } from "@/lib/services/uploadService";
import path from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const page = async ({ params }) => {
  const { uploadId } = params;
  const userId = "a59cd394-5f14-42e0-b559-e6f9e0fee105";

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
    path: path.join(FILE_STORAGE_PATH, upload.path),
    successfulFiches: upload.fiches.map((fiche) => ({
      id: fiche.id,
      ref: fiche.ref,
      source: fiche.dump.source.name,
      uploadStatus: { status: "successful", message: "Upload successful" },
      status: fiche.status,
      path: path.join(FILE_STORAGE_PATH, fiche.path),
    })),
    failedFiches: upload.failedFiches.map((fiche) => ({
      id: fiche.id,
      source: fiche.source,
      path: path.join(FILE_STORAGE_PATH, fiche.path),
      uploadStatus: { status: "failed", message: fiche.message },
      status: fiche.status,
      message: fiche.message,
    })),
    successfulFichesCount: upload.fiches.length,
    totalFichesCount: upload.fiches.length + upload.failedFiches.length,
  };
  return <ConsultUpload upload={formattedUpload} />;
};

export default page;
