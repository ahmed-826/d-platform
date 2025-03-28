import { useState } from "react";
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

const FormUpload = ({ onUploadComplete }) => {
  const [source, setSource] = useState("");
  const [dump, setDump] = useState("");
  const [object, setObject] = useState("");
  const [synthesis, setSynthesis] = useState("");
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !dump || !object) return;

    setIsSubmitting(true);

    try {
      // Simulate form processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a form name if not provided
      const generatedFormName =
        formName || `Form Upload - ${new Date().toLocaleDateString()}`;

      // Mock results
      const results = [
        {
          ref: `FORM-${Date.now()}-1`,
          source,
          status: "success",
          probleme: "---",
          uploadStatus: "Suspendue",
        },
      ];

      onUploadComplete(results, generatedFormName);
    } catch (err) {
      console.error("Error submitting form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter a name for this form upload"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TechCorp">TechCorp</SelectItem>
                  <SelectItem value="DataSystems">DataSystems</SelectItem>
                  <SelectItem value="InfoTech">InfoTech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dump">Dump</Label>
              <Select value={dump} onValueChange={setDump}>
                <SelectTrigger id="dump">
                  <SelectValue placeholder="Select a dump" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dump-2023-10">
                    October 2023 Dump
                  </SelectItem>
                  <SelectItem value="Dump-2023-09">
                    September 2023 Dump
                  </SelectItem>
                  <SelectItem value="Dump-2023-08">August 2023 Dump</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Generate Date</Label>
              <Input
                id="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="object">Object</Label>
            <Input
              id="object"
              value={object}
              onChange={(e) => setObject(e.target.value)}
              placeholder="Enter object"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="synthesis">Synthesis</Label>
            <Textarea
              id="synthesis"
              value={synthesis}
              onChange={(e) => setSynthesis(e.target.value)}
              placeholder="Enter synthesis"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Attach Source Documents</Label>
            <div className="flex items-center gap-2">
              <Input type="file" multiple />
              <Button type="button" variant="outline" size="sm">
                +
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Form"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormUpload;
