import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import prisma from "@/lib/db";

export default async function middleware(req) {
  const cookie = cookies().get("session")?.value;

  if (cookie) {
    const session = await decrypt(cookie);

    if (session?.userId) {
      return NextResponse.next();
    }
  }
  return NextResponse.redirect(new URL("/login", req.nextUrl));
}

// Matcher configuration
export const config = {
  matcher: ["/((?!_next/static|_next/image|login|favicon.ico).*)"],
};
