import { NextResponse } from "next/server";
import { data } from "@/utils/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  console.log("request ...");

  if (!data) {
    return NextResponse.json({
      data: null,
      error: { message: "Data not found", status: 404 },
    });
  }

  return NextResponse.json({ data: data, error: null });
}
