import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/upload/FileUpload";
import FormUpload from "@/components/upload/FormUpload";

const UploadView = ({ onUploadComplete }) => {
  const [activeTab, setActiveTab] = useState("file");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Upload Data</h2>

      <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="file" className="flex-1">
            Upload File
          </TabsTrigger>
          <TabsTrigger value="form" className="flex-1">
            Manual Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <FileUpload onUploadComplete={onUploadComplete} />
        </TabsContent>

        <TabsContent value="form">
          <FormUpload onUploadComplete={onUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadView;
