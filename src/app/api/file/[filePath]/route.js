import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export async function GET(request, { params }) {
  try {
    const { filePath } = params;

    console.log("filePath", filePath);

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    const relativePath = decodeURIComponent(filePath).split("/");
    const absolutePath = path.join(FILE_STORAGE_PATH, ...relativePath);

    console.log("absolutePath", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileStream = fs.createReadStream(absolutePath);

    return new Response(fileStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error fetching uploads",
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
        message: error.message,
      },
    });
  }
}
