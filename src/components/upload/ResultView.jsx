import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Download,
  Eye,
  File,
  PauseCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const ResultView = ({
  results,
  fileName,
  onStatusChange,
  isConsultView = false,
}) => {
  const handleDownload = (ref) => {
    console.log(`Downloading file with ref: ${ref}`);
    // Actual download logic would go here
  };

  const handleView = (ref) => {
    console.log(`Viewing details for: ${ref}`);
    // Navigation to detail view would go here
  };

  const handleDownloadZip = () => {
    console.log(`Downloading zip file: ${fileName}`);
    // Actual zip download logic would go here
  };

  // Sort results to show successful ones first, then failed ones
  const sortedResults = [...results].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "success" ? -1 : 1;
  });

  // Get the status icon based on the current upload status
  const getStatusIcon = (status) => {
    switch (status) {
      case "Suspendue":
        return <PauseCircle className="mr-1 h-4 w-4 text-yellow-500" />;
      case "Validé":
        return <CheckCircle className="mr-1 h-4 w-4 text-green-500" />;
      case "Annulé":
        return <XCircle className="mr-1 h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isConsultView ? "Consult Results" : "Upload Results"}
        </h2>
        <div className="flex items-center gap-4">
          {fileName && (
            <div className="flex items-center text-sm text-gray-600">
              <File className="mr-2 h-4 w-4" />
              <span className="font-medium mr-2">{fileName}</span>
              <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="text-sm text-gray-600">
            {results.length} items processed •{" "}
            {results.filter((r) => r.status === "success").length} successful
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Statut d'upload</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Problème</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-gray-500"
                >
                  No results available
                </TableCell>
              </TableRow>
            ) : (
              sortedResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{result.ref}</TableCell>
                  <TableCell>{result.source}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.status === "success" ? "success" : "destructive"
                      }
                      className="inline-flex items-center"
                    >
                      {result.status === "success" ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          <span>Succès</span>
                        </>
                      ) : (
                        <>
                          <X className="mr-1 h-3 w-3" />
                          <span>Échec</span>
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center justify-start w-28 px-2 h-8"
                        >
                          {getStatusIcon(result.uploadStatus)}
                          <span className="ml-1">{result.uploadStatus}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusChange?.(result.ref, "Suspendue")
                          }
                          className="flex items-center"
                        >
                          <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                          Suspendue
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(result.ref, "Validé")}
                          className="flex items-center"
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Validé
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(result.ref, "Annulé")}
                          className="flex items-center"
                        >
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Annulé
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{result.probleme}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {result.status === "success" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(result.ref)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(result.ref)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultView;
