import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, FileText } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const FormUpload = () => {
  const [source, setSource] = useState("");
  const [dump, setDump] = useState("");
  const [object, setObject] = useState("");
  const [synthesis, setSynthesis] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [sourceDocuments, setSourceDocuments] = useState([]);
  const router = useRouter();
  const { addPage, returnToPreviousPage } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !object) return;

    const generatedUploadName = `${
      uploadName ? uploadName + "-" : ""
    }Formulaire-${source}-${new Date().toLocaleDateString()}`;
    const data = {
      name: generatedUploadName,
      source,
      dump,
      object,
      synthesis,
      sourceDocuments,
      type: "form",
    };

    // uploading logic (to backend)

    const newUploadId = response.data.id;

    returnToPreviousPage();
    addPage({
      name: generatedUploadName,
      path: `/upload/consult/${newUploadId}`,
      type: "upload",
    });
    router.push(`/upload/consult/${newUploadId}`);
  };

  const handleSourceDocumentSelect = (selectedDocs) => {
    if (!selectedDocs) return;

    setSourceDocuments((prev) => [...prev, ...Array.from(selectedDocs)]);
  };

  const removeSourceDocument = (index) => {
    setSourceDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Nom d'upload</Label>
              <Input
                id="form-name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Entrez un nom pour cet upload"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Sélectionnez une source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TechCorp">TechCorp</SelectItem>
                  <SelectItem value="DataSystems">DataSystems</SelectItem>
                  <SelectItem value="InfoTech">InfoTech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dump">Dump</Label>
            <Select value={dump} onValueChange={setDump}>
              <SelectTrigger id="dump">
                <SelectValue placeholder="Sélectionnez un dump" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dump-2023-10">Dump Octobre 2023</SelectItem>
                <SelectItem value="Dump-2023-09">
                  Dump Septembre 2023
                </SelectItem>
                <SelectItem value="Dump-2023-08">Dump Août 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="object">Objet</Label>
            <Input
              id="object"
              value={object}
              onChange={(e) => setObject(e.target.value)}
              placeholder="Entrez l'objet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="synthesis">Synthèse</Label>
            <Textarea
              id="synthesis"
              value={synthesis}
              onChange={(e) => setSynthesis(e.target.value)}
              placeholder="Entrez la synthèse"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Documents source</Label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="file"
                id="form-source-documents"
                className="hidden"
                multiple
                onChange={(e) => handleSourceDocumentSelect(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("form-source-documents")?.click()
                }
              >
                Ajouter des documents
              </Button>
              <span className="text-sm text-gray-500">
                {sourceDocuments.length} document
                {sourceDocuments.length < 2 ? "" : "s"} sélectionné
                {sourceDocuments.length < 2 ? "" : "s"}
              </span>
            </div>

            {sourceDocuments.length > 0 && (
              <div className="space-y-2">
                {sourceDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm truncate max-w-[400px]">
                        {doc.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSourceDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Soumettre le formulaire</Button>
        </div>
      </form>
    </div>
  );
};

export default FormUpload;
