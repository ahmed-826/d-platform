import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
  try {
    // Extract the file path from the dynamic route
    const filePath = params.path.join("/");

    // Construct the absolute path to the file
    const fullPath = path.join(filePath);

    // Check if the file exists
    try {
      await fs.access(fullPath, fs.constants.F_OK);
    } catch {
      return NextResponse.json(
        { error: { message: "File not found." } },
        { status: 404 }
      );
    }

    // Read the file
    const fileContent = await fs.readFile(fullPath);

    // Determine the content type based on the file extension
    const mimeType =
      path.extname(fullPath).toLowerCase() === ".pdf"
        ? "application/pdf"
        : "application/octet-stream";

    // Return the file as a response
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
