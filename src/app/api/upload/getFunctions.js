import path from "path";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { HttpError } from "@/lib/classes";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

// GET functions
const getUSerIdAndRole = async () => {
  try {
    const cookie = cookies().get("session")?.value;
    const session = await decrypt(cookie);
    const userId = session?.userId;
    const role = await prisma.user
      .findUnique({ where: { id: userId } })
      .then((user) => user.role);
    return { userId, role };
  } catch (error) {
    throw new HttpError({ message: "Internal Server Error", status: 500 });
  }
};

const builtWhereFromSearchParams = (searchParams, role, userId) => {
  try {
    const where = {};
    if (!["superAdmin", "admin"].includes(role)) {
      throw new HttpError({ message: "Unauthorized", status: 401 });
    }

    if (role === "admin") {
      where.userId = userId;
    } else {
      const usernames = searchParams.getAll("username");
      if (usernames.length > 0) where.user.username = { in: usernames };
    }

    const uploadIds = searchParams.getAll("uploadId");
    if (uploadIds.length > 0) where.id = { in: uploadIds };

    const uploadStatutes = searchParams.getAll("uploadStatus");
    if (uploadStatutes.length > 0) where.status = { in: uploadStatutes };

    const uploadDates = searchParams
      .getAll("uploadDate")
      .map((date) => new Date(date));
    if (uploadDates.length > 0) where.date = { in: uploadDates };

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    return where;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError({ message: "Bad request", status: 400 });
  }
};

const formatUploads = (uploads) => {
  return uploads.map((upload) => ({
    ...upload,
    path: path.join(FILE_STORAGE_PATH, upload.path),
  }));
};

export { formatUploads, builtWhereFromSearchParams, getUSerIdAndRole };
