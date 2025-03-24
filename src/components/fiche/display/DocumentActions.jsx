import Link from "next/link";
import { useFiche } from "@/contexts/FicheContext";
import {
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  View,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Download from "./Download";
import Print from "./Print";

const DocumentActions = ({
  document,
  withNavigate,
  withPreview,
  withDownloadAndPrint,
}) => {
  const { entireMode, toggleEntireMode, navigatePrevious, navigateNext } =
    useFiche();

  return (
    <div className="flex items-center space-x-1">
      {withDownloadAndPrint && (
        <>
          <Download />
          <Print />
        </>
      )}
      {withNavigate && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigatePrevious(document)}
            className="h-7 w-7 p-0 hover:bg-gray-200"
            title="Document précédent"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateNext(document)}
            className="h-7 w-7 p-0 hover:bg-gray-200"
            title="Document suivant"
          >
            <ChevronRight size={16} />
          </Button>
        </>
      )}
      {withPreview && (
        <Link href={`/fiche/${document.name}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateNext(document)}
            className="h-7 w-7 p-0 hover:bg-gray-200"
            title="Aperçu"
          >
            <View size={16} />
          </Button>
        </Link>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleEntireMode(document)}
        className="h-7 w-7 p-0 hover:bg-gray-200"
        title={entireMode ? "Quitter le mode plein écran" : "Mode plein écran"}
      >
        {entireMode ? <Minimize size={16} /> : <Maximize size={16} />}
      </Button>
    </div>
  );
};

export default DocumentActions;
