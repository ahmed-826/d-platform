"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/upload/FileUpload";
import FormUpload from "@/components/upload/FormUpload";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";

const NewUpload = () => {
  const { breadcrumbs, addToBreadcrumbs } = useApp();
  const [activeTab, setActiveTab] = useState("file");

  useEffect(() => {
    if (breadcrumbs.length < 2) {
      addToBreadcrumbs([
        { title: "Téléversements", href: "/upload" },
        { title: "Nouveau téléversement", href: `/upload/newUpload` },
      ]);
    }
    if (breadcrumbs[breadcrumbs.length - 1].title !== "Nouveau téléversement") {
      addToBreadcrumbs({
        title: "Nouveau téléversement",
        href: `/upload/newUpload`,
      });
    }
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Téléversement des fiches</h2>

      <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="file" className="flex-1">
            Téléverser un fichier
          </TabsTrigger>
          <TabsTrigger value="form" className="flex-1">
            Formulaire manuel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <FileUpload />
        </TabsContent>

        <TabsContent value="form">
          <FormUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewUpload;
