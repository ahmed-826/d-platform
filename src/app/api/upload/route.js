import { uploadTransaction } from "@/lib/transactions/uploadTransaction";
import { NextResponse } from "next/server";

export async function POST(request) {
  const userId = "b60ed9a6-4e75-4149-952a-c0c3d35ac057";
  try {
    const formData = await request.formData();

    const uploadType = formData.get("uploadType");
    if (!uploadType) {
      throw new Error("Upload type is missing.");
    }
    if (!["FORM", "FILE", "API"].includes(uploadType)) {
      throw new Error("Upload type is invalid.");
    }
    if (["FILE", "API"].includes(uploadType)) {
      const zipFile = formData.get("file");
      if (!zipFile || typeof zipFile.arrayBuffer !== "function") {
        throw new Error("No file uploaded or file is invalid.");
      }

      const { error, status } = await uploadTransaction({
        zipFile,
        uploadType,
        userId,
      });
      if (error) {
        if (status === 409) {
          return NextResponse.json({ error }, { status: 409 });
        }
        throw new Error(error.message);
      }

      return NextResponse.json({ error: null }, { status: 200 });
    }

    return NextResponse.json({ error: null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: { message: "Erreur interne du serveur." },
    });
  }
}
