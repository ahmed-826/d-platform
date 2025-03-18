import SidebarSection from "./SidebarSection";
import { FileText } from "lucide-react";
import { useFiche } from "@/contexts/FicheContext";
import { useEffect } from "react";

const SourceDocuments = ({ sourceDocuments }) => {
  const { selectedDocId, handleDocumentClick } = useFiche();

  useEffect(() => {
    handleDocumentClick(sourceDocuments[0].id);
  }, []);

  return (
    <SidebarSection title="Documents Sources" icon={FileText} defaultOpen>
      <div className="space-y-1">
        {sourceDocuments.map((doc) => (
          <div
            key={doc.id}
            className={`px-2 py-2 rounded-md cursor-pointer text-sm transition-colors flex items-center ${
              selectedDocId === doc.id ? "bg-document font-medium" : ""
            }`}
            onClick={() => handleDocumentClick(doc.id)}
          >
            <FileText size={14} className="mr-2 text-gray-600" />
            <span>{doc.name}</span>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
};

export default SourceDocuments;
