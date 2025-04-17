import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DownloadDocument = ({ document, withDownload }) => {
  if (!withDownload) return;
  const handleDownload = () => {
    // To backend
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="h-7 w-7 p-0 hover:bg-gray-200"
      title="Télécharger"
    >
      <Download size={16} />
    </Button>
  );
};

export default DownloadDocument;
