"use client";
import { createContext, useContext, useState } from "react";

const FicheContext = createContext(null);

export const FicheProvider = ({ children, allDocuments }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [EntireModeselectedDocIndex, setEntireModeselectedDocIndex] =
    useState(null);
  const [entireMode, setEntireMode] = useState(false);

  const handleDocumentClick = (id) => {
    setSelectedDocId(id);

    if (entireMode) {
      const index = allDocuments.findIndex((doc) => doc.id === id);
      setEntireModeselectedDocIndex(index !== -1 ? index : null);
    }
  };

  const toggleEntireMode = (id) => {
    if (!entireMode) {
      const index = allDocuments.findIndex((doc) => doc.id === id);
      setEntireModeselectedDocIndex(index !== -1 ? index : null);
    }
    setEntireMode((prev) => !prev);
  };

  const navigatePrevious = () => {
    if (EntireModeselectedDocIndex !== null && EntireModeselectedDocIndex > 0) {
      setEntireModeselectedDocIndex((prev) => prev - 1);
    }
  };

  const navigateNext = () => {
    if (
      EntireModeselectedDocIndex !== null &&
      EntireModeselectedDocIndex < allDocuments.length - 1
    ) {
      setEntireModeselectedDocIndex((prev) => prev + 1);
    }
  };

  return (
    <FicheContext.Provider
      value={{
        selectedDocId,
        handleDocumentClick,
        EntireModeselectedDocIndex,
        setEntireModeselectedDocIndex,
        entireMode,
        toggleEntireMode,
        navigatePrevious,
        navigateNext,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};

export const useFiche = () => {
  const context = useContext(FicheContext);
  if (!context) {
    throw new Error("useFiche must be used within a FicheProvider");
  }
  return context;
};
