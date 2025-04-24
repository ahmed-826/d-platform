import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePaths = searchParams.getAll("filePath");
  const fileNameParam = searchParams.get("fileName");

  try {
    if (filePaths.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Missing required filePath parameter." },
        },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    if (filePaths.length === 1) {
      const filePath = filePaths[0];

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { data: null, error: { message: "File not found." } },
          { status: 404 }
        );
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = fileNameParam || path.basename(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            fileName
          )}"`,
          "Content-Type": "application/octet-stream",
        },
      });
    } else {
      // Multiple files → ZIP
      for (const filePath of filePaths) {
        if (!fs.existsSync(filePath)) continue;
        const fileData = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        zip.file(fileName, fileData);
      }

      const zipContent = await zip.generateAsync({ type: "nodebuffer" });

      const zipName = fileNameParam?.endsWith(".zip")
        ? fileNameParam
        : "download.zip";

      return new NextResponse(zipContent, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            zipName
          )}"`,
          "Content-Type": "application/zip",
        },
      });
    }
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { data: null, error: { message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}
