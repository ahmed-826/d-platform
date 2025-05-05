"use client";

import {
  Download,
  Plus,
  Eye,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { useEffect, useState } from "react";
import { runUpload, deleteUpload } from "@/lib/serverActions/uploadActions";

const UploadHistory = ({ uploadsData }) => {
  const [uploads, setUploads] = useState(uploadsData);
  const { toast } = useToast();
  const { breadcrumbs, addToBreadcrumbs } = useApp();

  useEffect(() => {
    if (breadcrumbs[breadcrumbs.length - 1].title !== "Téléversements") {
      addToBreadcrumbs({
        title: "Téléversements",
        href: "/upload",
      });
    }
  }, []);

  if (!uploads) return;

  const handleRun = async (id) => {
    toast({
      title: "Traitement en cours",
      description:
        "Le fichier est en cours de traitement. Veuillez patienter...",
    });
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id ? { ...upload, status: "Processing" } : upload
      )
    );

    const { success, data, error } = await runUpload(id);
    if (success) {
      toast({
        title: "Traitement terminé",
        description: "Le fichier a été traité avec succès.",
      });

      setUploads((prev) =>
        prev.map((upload) => (upload.id === id ? data : upload))
      );
    } else {
      toast({
        title: "Échec du traitement",
        description:
          error?.message ||
          "Une erreur inattendue s'est produite pendant le traitement.",
      });
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, status: "Failed" } : upload
        )
      );
    }
  };

  const handleDownload = async (path, fileName) => {
    const request = `/api/download?filePath=${path}&fileName=${fileName}`;
    try {
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error();
      }
      toast({
        title: "Téléchargement lancé",
        description: "Votre fichier est en cours de téléchargement.",
      });
      window.location.href = request;
    } catch {
      toast({
        title: "Erreur lors du téléchargement",
        description: "Impossible de récupérer le fichier. Veuillez réessayer.",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteUpload(id);
      if (result.success) {
        setUploads((prev) => prev.filter((upload) => upload.id !== id));
        toast({
          title: "Fichier supprimé",
          description: "Le fichier a été supprimé avec succès.",
          status: "success",
        });
      } else {
        toast({
          title: "Échec de la suppression",
          description: result.error || "Une erreur inconnue est survenue",
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Problème de connexion au serveur",
        status: "error",
      });
    }
  };

  const getTypeDisplayName = (type) => {
    switch (type) {
      case "Form":
        return "Formulaire";
      case "File":
        return "Fichier";
      case "API":
        return "API";
      default:
        return "Inconnu";
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-800 flex items-center gap-1 font-normal"
          >
            <Clock className="h-3 w-3 text-purple-600" />
            En attente
          </Badge>
        );
      case "Processing":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-800 flex items-center gap-1 font-normal"
          >
            <Loader2 className="h-3 w-3 animate-spin text-yellow-600" />
            En cours
          </Badge>
        );
      case "Completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-800 flex items-center gap-1 font-normal"
          >
            <CheckCircle className="h-3 w-3 text-green-600" />
            Terminé
          </Badge>
        );
      case "Failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-800 flex items-center gap-1 font-normal"
          >
            <XCircle className="h-3 w-3 text-red-600" />
            Échoué
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Historique des téléversements
          </h2>
          <Button asChild>
            <Link href="/upload/newUpload">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau téléversement
            </Link>
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[15%]">Téléversement</TableHead>
                <TableHead className="w-[13%]">Utilisateur</TableHead>
                <TableHead className="w-[12%]">Statut</TableHead>
                <TableHead className="w-[13%]">Fiches réussies</TableHead>
                <TableHead className="w-[12%]">Type</TableHead>
                <TableHead className="w-[15%]">Date</TableHead>
                <TableHead className="text-center w-[15%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-4 text-gray-500"
                  >
                    Aucun historique de téléversement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                uploads.map((upload, index) => (
                  <TableRow key={upload.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{upload.name}</TableCell>
                    <TableCell>{upload.user}</TableCell>

                    <TableCell>
                      <div className="flex">
                        {renderStatusBadge(upload.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-50 text-blue-800 rounded-md font-medium">
                        {upload.successfulFichesCount}/{upload.totalFichesCount}
                      </span>
                    </TableCell>
                    <TableCell>{getTypeDisplayName(upload.type)}</TableCell>
                    <TableCell>{upload.date}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        {upload.status === "Pending" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRun(upload.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Lancer</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/upload/${upload.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Consulter</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownload(upload.path, upload.fileName)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Télécharger</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(upload.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UploadHistory;
