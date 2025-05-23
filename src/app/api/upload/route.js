import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { RoleBasedError } from "@/lib/classes";
import { builtWhereFromSearchParams, formatUploads } from "./getFunctions";
import {
  formDataValidation,
  uploadByFileOrAPI,
  uploadByForm,
} from "./postFunctions";
import { HttpError } from "@/lib/classes/RoleBasedError";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId, role } = await getUSerIdAndRole();

    const where = builtWhereFromSearchParams(searchParams, role, userId);

    const uploads = await prisma.upload
      .findMany({
        where,
        include: {
          user: true,
          fiches: { include: { source: true } },
          failedFiches: true,
        },
        orderBy: { date: "desc" },
      })
      .then((uploads) => formatUploads(uploads));

    return NextResponse.json({ success: true, data: uploads }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, data: null, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, data: null, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    formData.set("userId", "2eae0ec4-a489-4134-8931-202a38912f51"); // TODO: remove this line when userId is passed from the client side

    formDataValidation(formData);

    await uploadByFileOrAPI(formData);
    //await uploadByForm(formData);

    return NextResponse.json({
      success: true,
      data: null,
      message: "La ressource a été téléversé avec succès",
    });
  } catch (error) {
    const role = "superAdmin";

    return NextResponse.json({
      success: false,
      data: null,
      message:
        error instanceof RoleBasedError
          ? error.getMessage(role)
          : `Erreur interne du serveur.\n${error.message}`,
    });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);

    const ids = searchParams.getAll("id");
    const userIds = searchParams.getAll("userId");

    const where = {};

    where.id = { in: ids };
    where.userId = { in: userIds };

    const uploads = await prisma.upload.findMany({ where });

    return NextResponse.json({ success: true, data: uploads }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
