import SidebarSection from "./SidebarSection";
import { Info } from "lucide-react";

const GeneralInfo = ({ generalInfo }) => {
  return (
    <SidebarSection title="Informations Générales" icon={Info} defaultOpen>
      <div className="space-y-2">
        <div>
          <div className="text-xs text-muted-foreground">Référence</div>
          <div className="font-medium">{generalInfo?.name}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Source</div>
          <div className="text-sm">{generalInfo?.source}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Créé Par</div>
          <div>{generalInfo?.createdBy}</div>
        </div>
      </div>
    </SidebarSection>
  );
};

export default GeneralInfo;
