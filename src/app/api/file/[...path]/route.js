import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
  try {
    const filePath = params.path.join("/");

    const fullPath = path.join(filePath);

    try {
      await fs.access(fullPath, fs.constants.F_OK);
    } catch {
      return NextResponse.json(
        { error: { message: "File not found." } },
        { status: 404 }
      );
    }

    const fileContent = await fs.readFile(fullPath);

    const ext = path.extname(fullPath).toLowerCase();
    let mimeType;

    switch (ext) {
      case ".pdf":
        mimeType = "application/pdf";
        break;
      case ".doc":
        mimeType = "application/msword";
        break;
      case ".docx":
        mimeType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      default:
        mimeType = "application/octet-stream";
    }

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
      },
    });
  } catch (error) {
    console.error("Error serving file:", error.message);
    return NextResponse.json(
      { error: { message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}
