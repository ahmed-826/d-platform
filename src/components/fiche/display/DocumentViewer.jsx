"use client";
import Link from "next/link";
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
  View,
} from "lucide-react";
import { useFiche } from "@/contexts/FicheContext";
import EmptyViewer from "./EmptyViewer";

const DocumentViewer = ({ document, withNavigate = false }) => {
  const { entireMode, toggleEntireMode, navigatePrevious, navigateNext } =
    useFiche();

  if (!document) return <EmptyViewer />;
  const withPreview = document.docType === "observation";
  const extension = document.path.split(".").pop();

  const displayConfig = {
    fiche: {
      icon: FileText,
      type: "Fiche",
    },
    source: {
      icon: FileText,
      type: "Document source",
    },
    observation: {
      icon: Lightbulb,
      type: "Observation",
    },
  };
  const type = displayConfig[document.docType].type;
  const Icon = displayConfig[document.docType].icon;

  return (
    <div className="h-full w-full">
      <Card className="h-full shadow-sm">
        <CardHeader className="py-2 px-4 bg-accent rounded-t-lg border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center">
            <Icon size={16} className="mr-2 text-muted-foreground" />
            <span className="font-semibold">{type}</span>: {document.name}
          </CardTitle>
          <div className="flex items-center space-x-1">
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
