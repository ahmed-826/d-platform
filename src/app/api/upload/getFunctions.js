import path from "path";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

// GET functions
const formatUploads = (uploads) => {
  return uploads.map((upload) => ({
    ...upload,
    path: path.join(FILE_STORAGE_PATH, upload.path),
  }));
};

export { formatUploads };
