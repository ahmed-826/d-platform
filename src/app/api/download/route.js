import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUploadById } from "@/lib/services/uploadService";
import { getFicheById } from "@/lib/services/ficheService";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const tableName = searchParams.get("tableName");
  const id = searchParams.get("id");

  try {
    if (!tableName || !id) {
      return NextResponse.json(
        { data: null, error: { message: "Missing required parameters." } },
        { status: 400 }
      );
    }

    let object;
    if (tableName === "upload") {
      object = await getUploadById(id);
    } else if (tableName === "fiche") {
      object = await getFicheById(id);
    } else if (tableName === "document") {
    } else if (tableName === "failedFiche") {
    } else {
      return NextResponse.json(
        { data: null, error: { message: "Invalid table name." } },
        { status: 400 }
      );
    }

    if (!object) {
      return NextResponse.json(
        { data: null, error: { message: "Record not found." } },
        { status: 404 }
      );
    }
    const filePath = path.join(FILE_STORAGE_PATH, object.path);
    console.log(filePath);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { data: null, error: { message: "File not found." } },
        { status: 404 }
      );
    }

    const fileStream = fs.createReadStream(filePath);
    const { base: fileName } = path.parse(object.path);

    return new NextResponse(fileStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}
