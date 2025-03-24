const PDFViewer = ({ path, name }) => {
  return (
    <div className="h-full w-full">
      {path ? (
        <iframe
          src={path}
          className="w-full h-full border-0 bg-white"
          title={name || "PDF Viewer"}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Aucun document disponible
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
