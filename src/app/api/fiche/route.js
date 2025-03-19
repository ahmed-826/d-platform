import { NextResponse } from "next/server";
import { Data } from "@/utils/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const data = id === "FICHE-2023-001" ? Data : null;

  if (!data) {
    return NextResponse.json({
      data: null,
      error: { message: "Data not found", status: 404 },
    });
  }

  return NextResponse.json({ data: data, error: null });
}
