"use client";

import { useState } from "react";
import UploadNavigation from "@/components/upload/Navigation";
import HistoryView from "@/components/upload/HistoryView";
import UploadView from "@/components/upload/UploadView";
import ResultView from "@/components/upload/ResultView";

const Upload = () => {
  const [currentView, setCurrentView] = useState("history");
  const [uploadResults, setUploadResults] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleUploadComplete = (results, name) => {
    const resultsWithStatus = results.map((result) => ({
      ...result,
      uploadStatus: "Suspendue",
    }));

    setUploadResults(resultsWithStatus);
    setFileName(name);
    setCurrentView("result");
  };

  const handleStatusChange = (ref, newStatus) => {
    setUploadResults((prev) =>
      prev.map((result) =>
        result.ref === ref ? { ...result, uploadStatus: newStatus } : result
      )
    );

    if (selectedHistory && selectedHistory.results) {
      const updatedHistory = {
        ...selectedHistory,
        results: selectedHistory.results.map((result) =>
          result.ref === ref ? { ...result, uploadStatus: newStatus } : result
        ),
      };
      setSelectedHistory(updatedHistory);
    }
  };

  const handleConsult = (historyItem) => {
    if (!historyItem.results) {
      const mockResults = Array.from({ length: historyItem.count }, (_, i) => ({
        ref: `REF-${historyItem.id}-${i + 1}`,
        source: historyItem.name,
        status: Math.random() > 0.2 ? "success" : "failed",
        probleme: Math.random() > 0.2 ? "---" : "Error processing data",
        uploadStatus: "Suspendue",
      }));
      historyItem.results = mockResults;
    }

    setSelectedHistory(historyItem);
    setCurrentView("consult");
  };

  const navigateToView = (view) => {
    if (view === "history") {
      setSelectedHistory(null);
      setCurrentView(view);
    } else if (
      (view === "upload" &&
        (currentView === "upload" ||
          currentView === "result" ||
          currentView === "consult")) ||
      (view === "result" && currentView === "result") ||
      (view === "consult" && currentView === "consult")
    ) {
      setCurrentView(view);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Upload Management</h1>

      <UploadNavigation
        currentView={currentView}
        onNavigate={navigateToView}
        selectedHistoryName={selectedHistory?.name}
      />

      <div className="mt-6">
        {currentView === "history" && (
          <HistoryView
            onUpload={() => setCurrentView("upload")}
            onConsult={handleConsult}
          />
        )}

        {currentView === "upload" && (
          <UploadView onUploadComplete={handleUploadComplete} />
        )}

        {currentView === "result" && (
          <ResultView
            results={uploadResults}
            fileName={fileName}
            onStatusChange={handleStatusChange}
          />
        )}

        {currentView === "consult" && selectedHistory && (
          <ResultView
            results={selectedHistory.results || []}
            fileName={selectedHistory.name}
            onStatusChange={handleStatusChange}
            isConsultView
          />
        )}
      </div>
    </div>
  );
};

export default Upload;
