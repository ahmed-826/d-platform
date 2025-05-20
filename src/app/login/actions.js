"use server";

import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";
import prisma from "@/lib/db";

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

export async function login(prevState, formData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({ where: { username: username } });
  if (!user) {
    return {
      errors: {
        username: ["user not exist"],
      },
    };
  }

  if (username !== user.username || password !== user.password) {
    return {
      errors: {
        username: ["Invalid username or password"],
      },
    };
  }

  await createSession(user.id);
}

export async function logout() {
  await deleteSession();
}
