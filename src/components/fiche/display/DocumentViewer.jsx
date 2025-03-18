"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import PDFViewer from "./PDFViewer";
import {
  FileText,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { useFiche } from "@/contexts/FicheContext";

const DocumentViewer = ({ document }) => {
  const { entireMode, toggleEntireMode, navigatePrevious, navigateNext } =
    useFiche();
  const FileIcon = document.docType === "observation" ? Lightbulb : FileText;

  const displayedTypeMapping = {
    fiche: "Fiche",
    source: "Document source",
    observation: "Observation",
  };
  const displayedType = displayedTypeMapping[document.docType];
  const extension = document.path.split(".").pop();

  return (
    <div className="h-full w-full">
      <Card className="h-full shadow-sm">
        <CardHeader className="py-2 px-4 bg-accent rounded-t-lg border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center">
            <FileIcon size={16} className="mr-2 text-gray-600" />
            <span className="font-semibold">{displayedType}</span>:{" "}
            {document.name}
          </CardTitle>
          <div className="flex items-center space-x-4">
            {entireMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigatePrevious}
                  className="h-7 w-7 p-0"
                  title="Document précédent"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateNext}
                  className="h-7 w-7 p-0"
                  title="Document suivant"
                >
                  <ChevronRight size={16} />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleEntireMode(document.id)}
              className="h-7 w-7 p-0"
              title={
                entireMode ? "Quitter le mode plein écran" : "Mode plein écran"
              }
            >
              {entireMode ? <Minimize size={16} /> : <Maximize size={16} />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-40px)]">
          {extension === "pdf" && (
            <PDFViewer path={document.path} name={document.name} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentViewer;
