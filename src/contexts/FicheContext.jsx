"use client";
import { createContext, useContext, useState } from "react";

const FicheContext = createContext(null);

export const FicheProvider = ({
  children,
  fiche,
  sourceDocuments,
  observations,
}) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [entireMode, setEntireMode] = useState(false);

  const handleDocumentClick = (document) => {
    if (document?.id && document?.id !== selectedDoc?.id)
      setSelectedDoc(document);
  };

  const toggleEntireMode = (document) => {
    if (!entireMode) {
      setSelectedDoc(document);
    }
    setEntireMode((prev) => !prev);
  };

  const navigatePrevious = (document) => {
    const docType = document?.docType;
    if (docType === "source") {
      const index = sourceDocuments.findIndex((doc) => doc.id === document.id);
      if (index > 0) {
        setSelectedDoc(sourceDocuments[index - 1]);
      } else if (index === 0 && entireMode) setSelectedDoc(fiche);
    } else if (docType === "observation") {
      const index = observations.findIndex((obs) => obs.id === document.id);
      if (index > 0) {
        setSelectedDoc(observations[index - 1]);
      }
    }
  };

  const navigateNext = (document) => {
    const docType = document?.docType;
    if (docType === "fiche" && entireMode) setSelectedDoc(sourceDocuments[0]);
    else if (docType === "source") {
      const index = sourceDocuments.findIndex((doc) => doc.id === document.id);
      if (index < sourceDocuments.length - 1) {
        setSelectedDoc(sourceDocuments[index + 1]);
      }
    } else if (docType === "observation") {
      const index = observations.findIndex((obs) => obs.id === document.id);
      if (index < observations.length - 1) {
        setSelectedDoc(observations[index + 1]);
      }
    }
  };

  return (
    <FicheContext.Provider
      value={{
        selectedDoc,
        handleDocumentClick,
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
