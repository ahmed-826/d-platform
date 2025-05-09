"use client";
import {
  Check,
  X,
  Eye,
  Download,
  File,
  PauseCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Flag,
  Copy,
  ListFilter,
  ShieldQuestion,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  updateFichesStatus,
  deleteFiche,
  deleteMultipleFiches,
} from "@/lib/serverActions/ficheActions";
import { deleteFailedFiche } from "@/lib/serverActions/failedFicheActions";

const ConsultUpload = ({ upload }) => {
  const [successfulFiches, setSuccessfulFiches] = useState([]);
  const [failedFiches, setFailedFiches] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSuccessfulFiches(
      upload.successfulFiches.map((fiche) => ({
        ...fiche,
        newStatus: null,
        selected: false,
      }))
    );
    setFailedFiches(upload.failedFiches);
  }, []);

  useEffect(() => {
    const selectedCount = successfulFiches.filter(
      (fiche) => fiche.selected
    ).length;
    if (selectedCount === 0) {
      setSelectAll(false);
    }
  }, [successfulFiches]);

  const { breadcrumbs, addToBreadcrumbs } = useApp();
  useEffect(() => {
    if (breadcrumbs.length < 2) {
      addToBreadcrumbs([
        { title: "Téléversements", href: "/upload" },
        { title: upload.name, href: `/upload/${upload.id}` },
      ]);
    }
    if (breadcrumbs[breadcrumbs.length - 1].title !== upload.name) {
      addToBreadcrumbs({ title: upload.name, href: `/upload/${upload.id}` });
    }
  }, []);

  // handle successfulFiche actions
  const handleDownload = async ({ filePath, fileName, selectedOnes }) => {
    let request = "/api/download?";
    if (selectedOnes) {
      const selectedFichesPaths = successfulFiches
        .filter((fiche) => fiche.selected)
        .map((fiche) => fiche.path);
      const query = selectedFichesPaths
        .map((path) => `filePath=${encodeURIComponent(path)}`)
        .join("&");
      request = request + query;
    } else {
      request = request + `filePath=${filePath}`;
    }

    if (fileName) {
      request = request + `&fileName=${fileName}`;
    }
    try {
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error();
      }
      toast({
        title: "Téléchargement lancé",
        description: "Votre ressource est en cours de téléchargement.",
      });
      window.location.href = request;
    } catch {
      toast({
        title: "Erreur lors du téléchargement",
        description:
          "Impossible de récupérer la ressource. Veuillez réessayer.",
      });
    }
  }; ///

  const handleDeleteFiche = async (ficheId) => {
    const {
      success,
      data: deletedFicheId,
      message,
    } = await deleteFiche(ficheId);

    setSuccessfulFiches((prev) =>
      prev.filter((fiche) => fiche.id !== deletedFicheId)
    );

    toast({
      title: success ? "Ressource supprimée" : "Échec de la suppression",
      description: message,
      variant: success ? "default" : "destructive",
    });
  }; ///

  const handleDeleteMultipleFiches = async () => {
    const fichesToBeDeletedIds = successfulFiches
      .filter((fiche) => fiche.selected)
      .map((fiche) => fiche.id);

    const {
      success,
      data: deletedFichesIds,
      message,
    } = await deleteMultipleFiches(fichesToBeDeletedIds);

    setSuccessfulFiches((prev) =>
      prev.filter((fiche) => !deletedFichesIds.includes(fiche.id))
    );

    toast({
      title: success ? "Ressources supprimés" : "Échec de la suppression",
      description: message,
      variant: success ? "default" : "destructive",
    });
  }; ///

  const handleReportFiche = async (ficheId) => {};

  const handleReportMultipleFiches = async () => {};

  const handleDeleteFailedFiche = async (ficheId) => {
    const {
      success,
      data: deletedFicheId,
      message,
    } = await deleteFailedFiche(ficheId);

    setFailedFiches((prev) =>
      prev.filter((fiche) => fiche.id !== deletedFicheId)
    );

    toast({
      title: success ? "Ressource supprimée" : "Échec de la suppression",
      description: message,
      variant: success ? "default" : "destructive",
    });
  }; ///

  const handleChangeStatus = (id, newStatus) => {
    setSuccessfulFiches((prev) =>
      prev.map((fiche) => (fiche.id === id ? { ...fiche, newStatus } : fiche))
    );
  }; ///

  const handleChangeMultipleStatus = (newStatus) => {
    setSuccessfulFiches((prev) =>
      prev.map((fiche) => (fiche.selected ? { ...fiche, newStatus } : fiche))
    );
  }; ///

  const handleCopyZipFileName = () => {
    navigator.clipboard.writeText(upload.fileName);
  }; ///

  const cancelChanges = () => {
    setSuccessfulFiches((prev) =>
      prev.map((fiche) => ({ ...fiche, newStatus: null }))
    );
  }; ///

  const applyChanges = async () => {
    const fichesToBeUpdate = successfulFiches
      .filter((fiche) => fiche.status !== fiche.newStatus && fiche.newStatus)
      .map((fiche) => ({ id: fiche.id, status: fiche.newStatus }));

    const {
      success,
      data: updatedFichesIds,
      message,
    } = await updateFichesStatus(fichesToBeUpdate);

    setSuccessfulFiches((prev) =>
      prev.map((fiche) => {
        if (updatedFichesIds.includes(fiche.id)) {
          return {
            ...fiche,
            status: fiche.newStatus,
            newStatus: null,
            selected: false,
          };
        }
        if (!fichesToBeUpdate.includes(fiche.id) && fiche.selected) {
          return { ...fiche, selected: false };
        }
        return fiche;
      })
    );

    toast({
      title: success ? "Ressources mises à jour" : "Échec de la mise à jour",
      description: message,
      variant: success ? "default" : "destructive",
    });
  }; //*  (handle singular/plural in the message)

  const toggleSelectItem = (id) => {
    setSuccessfulFiches((prev) =>
      prev.map((fiche) =>
        fiche.id === id ? { ...fiche, selected: !fiche.selected } : fiche
      )
    );
  }; ///

  const toggleSelectAll = () => {
    setSelectAll((prev) => !prev);
    setSuccessfulFiches((prev) =>
      prev.map((fiche) => ({ ...fiche, selected: !selectAll }))
    );
  }; ///

  const selectedCount = successfulFiches.filter(
    (fiche) => fiche.selected
  ).length;
  const pendingCount = successfulFiches.filter(
    (fiche) => fiche.newStatus && fiche.newStatus !== fiche.status
  ).length;

  const getStatusDisplayName = (status) => {
    switch (status) {
      case "Suspended":
        return "Suspendue";
      case "Valid":
        return "Validée";
      case "Canceled":
        return "Annulée";
      default:
        return "Inconnue";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "Suspended":
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case "Valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ShieldQuestion className="h-4 w-4 text-gray-500" />;
    }
  };

  let index = 0;
  return (
    <TooltipProvider>
      <div className="px-6 py-4 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Consulter téléversement:{" "}
            <span className="bg-gray-100 rounded-2xl px-2 py-1 text-gray-600">
              {upload.name}
            </span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">
                      {upload.fileName}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{upload.fileName}</p>
                </TooltipContent>
              </Tooltip>

              <div className="ml-2 flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyZipFileName}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copier le nom</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDownload({
                          filePath: upload.path,
                          fileName: upload.fileName,
                        })
                      }
                      className="h-7 w-7 p-0"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Télécharger le fichier</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="text-sm bg-gray-100 px-3 py-1 rounded-full font-medium">
              <span className="text-green-600">
                {upload.successfulFichesCount}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-700">{upload.totalFichesCount}</span>
              <span className="ml-1 text-gray-600">fiches réussies</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              {selectAll ? "Tout désélectionner" : "Tout sélectionner"}
            </Label>
            <span className="text-gray-400 text-sm">|</span>
            <span className="text-sm text-gray-500">
              {selectedCount} fiche{selectedCount < 2 ? "" : "s"} sélectionnée
              {selectedCount < 2 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload({ selectedOnes: true })}
                  disabled={selectedCount === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Télécharger la sélection</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteMultipleFiches}
                  disabled={selectedCount === 0}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Supprimer la sélection</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReportMultipleFiches}
                  disabled={selectedCount === 0}
                >
                  <Flag className="h-4 w-4 text-orange-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Signaler la sélection</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedCount === 0}
                      className="flex items-center gap-1"
                    >
                      <ListFilter className="h-4 w-4 text-blue-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleChangeMultipleStatus("Suspended")}
                      className="flex items-center cursor-pointer"
                    >
                      <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                      Suspendue
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeMultipleStatus("Valid")}
                      className="flex items-center cursor-pointer"
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Validé
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeMultipleStatus("Canceled")}
                      className="flex items-center cursor-pointer"
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Annulé
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Modifier le statut</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {pendingCount !== 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <AlertDescription className="text-blue-700">
                {pendingCount} modification{pendingCount < 2 ? "" : "s"} en
                attente. Veuillez appliquer ou annuler les changements.
              </AlertDescription>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelChanges}
                  className="h-8 px-2 py-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyChanges}
                  className="h-8 px-2 py-1"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </Alert>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Statut d'upload</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-center w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upload.totalFichesCount === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-4 text-gray-500"
                  >
                    Aucun résultat disponible
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {successfulFiches.map((fiche) => {
                    index++;
                    return (
                      <TableRow
                        key={fiche.id}
                        className={
                          fiche.newStatus && fiche.newStatus !== fiche.status
                            ? "bg-blue-50"
                            : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={fiche.selected}
                            onCheckedChange={() => toggleSelectItem(fiche.id)}
                          />
                        </TableCell>
                        <TableCell>{index}</TableCell>
                        <TableCell className="font-medium">
                          {fiche.ref}
                        </TableCell>
                        <TableCell>{fiche.source}</TableCell>
                        <TableCell>
                          <Badge
                            variant="success"
                            className="inline-flex items-center bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            <span>Succès</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`flex items-center justify-start w-28 px-2 h-8 ${
                                  fiche.newStatus &&
                                  fiche.newStatus !== fiche.status
                                    ? "border border-blue-300"
                                    : ""
                                }`}
                              >
                                {getStatusIcon(fiche.newStatus || fiche.status)}
                                <span className="ml-1">
                                  {getStatusDisplayName(
                                    fiche.newStatus || fiche.status
                                  )}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeStatus(fiche.id, "Suspended")
                                }
                                className="flex items-center cursor-pointer"
                              >
                                <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                Suspendue
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeStatus(fiche.id, "Valid")
                                }
                                className="flex items-center cursor-pointer"
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Validé
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeStatus(fiche.id, "Canceled")
                                }
                                className="flex items-center cursor-pointer"
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                Annulé
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>{fiche.uploadStatus.message}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/fiche/${fiche.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Consulter la fiche</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDownload({ filePath: fiche.path })
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
                                  onClick={() => handleReportFiche(fiche.id)}
                                >
                                  <Flag className="h-4 w-4 text-orange-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Signaler</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFiche(fiche.id)}
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
                    );
                  })}

                  {failedFiches.map((fiche) => {
                    index++;
                    return (
                      <TableRow key={fiche.id}>
                        <TableCell></TableCell>
                        <TableCell>{index}</TableCell>
                        <TableCell className="font-medium">—</TableCell>
                        <TableCell>{fiche.source}</TableCell>
                        <TableCell>
                          <Badge
                            variant="destructive"
                            className="inline-flex items-center bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <X className="mr-1 h-3 w-3" />
                            <span>Échec</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-start w-28 px-2 h-8"
                            disabled
                          >
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            <span>Annulé</span>
                          </Button>
                        </TableCell>
                        <TableCell>{fiche.message}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {fiche?.path && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownload({ filePath: fiche.path })
                                    }
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Télécharger</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteFailedFiche(fiche.id)
                                  }
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
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ConsultUpload;
