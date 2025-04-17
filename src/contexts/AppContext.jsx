"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([
    { title: "home", href: "/" },
  ]);

  const addToBreadcrumbs = (page) => {
    if (Array.isArray(page)) {
      setBreadcrumbs((prev) => [...prev, ...page]);
      return;
    }
    setBreadcrumbs((prev) => [...prev, page]);
  };

  const goBackToPrevious = () => {
    const newBreadCrumb = breadcrumbs.slice(0, -1);
    setBreadcrumbs((prev) => newBreadCrumb);
  };

  const goBack = (pageIndex) => {
    const newBreadCrumb = breadcrumbs.slice(0, pageIndex + 1);
    setBreadcrumbs((prev) => newBreadCrumb);
  };

  return (
    <AppContext.Provider
      value={{
        breadcrumbs,
        addToBreadcrumbs,
        goBackToPrevious,
        goBack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
};
