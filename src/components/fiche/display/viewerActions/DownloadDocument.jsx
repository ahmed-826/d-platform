import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DownloadDocument = ({ document, withDownload }) => {
  const { toast } = useToast();

  if (!withDownload) return;
  const handleDownload = async () => {
    const request = `/api/download?filePath=${document.path}`;
    try {
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error();
      }
      toast({
        title: "Téléchargement lancé",
        description: "Votre document est en cours de téléchargement.",
      });
      window.location.href = request;
    } catch {
      toast({
        title: "Erreur lors du téléchargement",
        description: "Impossible de récupérer le document. Veuillez réessayer.",
      });
    }
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
