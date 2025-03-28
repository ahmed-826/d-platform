import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";

const FileUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError(null);

    if (
      selectedFile.type !== "application/zip" &&
      !selectedFile.name.endsWith(".zip")
    ) {
      setError("Please upload a .zip file");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock results
      const results = [
        {
          ref: "ABC-1234",
          source: "TechCorp",
          status: "success",
          probleme: "---",
          uploadStatus: "Suspendue",
        },
        {
          ref: "ABC-5678",
          source: "TechCorp",
          status: "failed",
          probleme: "data.json n'exist pas",
          uploadStatus: "Suspendue",
        },
        {
          ref: "ABC-9012",
          source: "TechCorp",
          status: "success",
          probleme: "---",
          uploadStatus: "Suspendue",
        },
        {
          ref: "ABC-3456",
          source: "TechCorp",
          status: "success",
          probleme: "---",
          uploadStatus: "Suspendue",
        },
        {
          ref: "ABC-7890",
          source: "TechCorp",
          status: "failed",
          probleme: "Missing metadata",
          uploadStatus: "Suspendue",
        },
      ];

      onUploadComplete(results, file.name);
    } catch (err) {
      setError("An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".zip"
          onChange={(e) =>
            e.target.files && handleFileSelect(e.target.files[0])
          }
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Drag & Drop Your .zip File Here
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse your files
        </p>

        {file && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md inline-block">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
