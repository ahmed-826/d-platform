import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
    if (
      ["application/zip", "application/x-zip-compressed"].includes(
        selectedFile?.type
      ) &&
      selectedFile?.name?.endsWith(".zip")
    ) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Fichier invalide",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("type", "File");
    formData.append("file", file);

    const { success, message } = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    }).then((response) => response.json());

    toast({
      title: success ? "Fichier téléversé" : "Échec du téléversement",
      description: message,
      variant: success ? "default" : "destructive",
    });

    if (success) {
      router.push("/upload");
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
          Glissez-déposez votre fichier .zip ici
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          ou cliquez pour parcourir votre fichier
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

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={!file}>
          Téléverser les fichiers
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
