import { FileText, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PDFViewer from "./PDFViewer";
import EmptyViewer from "./EmptyViewer";
import DocumentActions from "./DocumentActions";

const DocumentViewer = ({ document, withNavigate = false }) => {
  if (!document) return <EmptyViewer />;
  const withPreview = document.docType === "observation";
  const withDownloadAndPrint = document.docType === "fiche";
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
          <DocumentActions
            document={document}
            withNavigate={withNavigate}
            withPreview={withPreview}
            withDownloadAndPrint={withDownloadAndPrint}
          />
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
