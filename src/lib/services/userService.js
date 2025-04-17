import prisma from "@/lib/db";

export async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}
