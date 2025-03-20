"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import GeneralInfo from "./sidebar/GeneralInfo";
import Observations from "./sidebar/Observations";
import SourceDocuments from "./sidebar/SourceDocuments";
import Entities from "./sidebar/Entities";
import Report from "./sidebar/Report";

import { useFiche } from "@/contexts/FicheContext";
import { useEffect } from "react";

const Sidebar = ({
  ficheInfo,
  sourceDocuments,
  observations,
  namedEntities,
}) => {
  const { handleDocumentClick } = useFiche();
  useEffect(() => {
    handleDocumentClick(sourceDocuments[0] || observations[0] || null);
  }, []);

  return (
    <div className="h-full flex flex-col border-r bg-card overflow-auto">
      <div className="p-4">
        <h2 className="text-lg font-medium">Explorateur de Documents</h2>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <GeneralInfo generalInfo={ficheInfo} />

        <SourceDocuments sourceDocuments={sourceDocuments} />

        <Observations observations={observations} />

        <Entities namedEntities={namedEntities} />
      </ScrollArea>

      <Report />
    </div>
  );
};

export default Sidebar;
