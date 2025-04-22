"use server";

import fs from "fs/promises";
import { deleteUploadById, getUploadById } from "@/lib/services/uploadService";
import { getProductsFromZipFile } from "@/lib/transactions/productTransaction";

export const runUpload = async (uploadId) => {
  try {
    const upload = await getUploadById(uploadId);
    if (!upload) {
      throw new Error("Upload not found.");
    }
    if (!upload.path) {
      throw new Error("Upload path is missing.");
    }
    const fileData = await fs.readFile(upload.path);
    await getProductsFromZipFile(fileData, uploadId);
    return "COMPLETED";
  } catch (error) {
    console.log("Error:", error.message);
    return "FAILED";
  }
};

export const deleteUpload = async (id) => {
  return await deleteUploadById(id);
};
