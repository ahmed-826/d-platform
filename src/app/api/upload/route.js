import { ficheTransaction } from "@/lib/transactions";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const type = formData.get("type");
    if (!type) {
      return NextResponse.json({ message: "Missing type" }, { status: 400 });
    }
    if (!["FORM", "FILE", "API"].includes(type)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    const dump = "";
    const isDumpExist = await ficheTransaction({ dump, source: "ruits" });

    return NextResponse.json({ isDumpExist: isDumpExist }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 400 });
  }
}
