import SidebarSection from "./SidebarSection";
import { Lightbulb } from "lucide-react";
import { useFiche } from "@/contexts/FicheContext";

const Observations = ({ observations }) => {
  const { selectedDocId, handleDocumentClick } = useFiche();

  return (
    <SidebarSection title="Observations" icon={Lightbulb} defaultOpen>
      <div className="space-y-1">
        {observations.map((obs) => (
          <div
            key={obs.id}
            className={`px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors flex items-center ${
              selectedDocId === obs.id ? "bg-document font-medium" : ""
            }`}
            onClick={() => handleDocumentClick(obs.id)}
          >
            <Lightbulb size={14} className="mr-2 text-gray-600" />
            <span>{obs.name}</span>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
};

export default Observations;
