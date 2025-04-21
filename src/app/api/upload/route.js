import { uploadTransaction } from "@/lib/transactions/uploadTransaction";
import { NextResponse } from "next/server";

export async function POST(request) {
  const userId = "7bd85074-4668-4b82-a5c9-eb3a8c78b403";
  try {
    const formData = await request.formData();

    const uploadType = formData.get("uploadType");
    if (!uploadType) {
      return NextResponse.json(
        { data: null, error: { message: "Upload type is missing." } },
        { status: 400 }
      );
    }
    if (!["FORM", "FILE", "API"].includes(uploadType)) {
      return NextResponse.json(
        { data: null, error: { message: "Upload type is invalid." } },
        { status: 400 }
      );
    }
    if (["FILE", "API"].includes(uploadType)) {
      const zipFile = formData.get("zipFile");
      if (!zipFile || typeof zipFile.arrayBuffer !== "function") {
        return NextResponse.json(
          {
            data: null,
            error: { message: "No file uploaded or file is invalid." },
          },
          { status: 400 }
        );
      }

      const { data, error, status } = await uploadTransaction({
        zipFile,
        uploadType,
        userId,
      });
      if (error) {
        return NextResponse.json({ data, error }, { status });
      }
      const uploadId = data.uploadId;
    }

    return NextResponse.json({ data: "Done!", error: null }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
