import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

const loginSchema = z.object({
  username: z
    .string()
    .min(2, { message: "username must be at least 2 characters" })
    .trim(),
  password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters" })
    .trim(),
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const result = loginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
      return NextResponse.json({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { username, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      return NextResponse.json({
        success: false,
        errors: { username: ["user not exist"] },
      });
    }

    if (username !== user.username || password !== user.password) {
      return NextResponse.json({
        success: false,
        errors: { username: ["Invalid username or password"] },
      });
    }

    await createSession(user.id);
    NextResponse.json({ success: true });
  } catch (error) {
    NextResponse.json({ success: false, error: "Internal server error" });
  }
}
