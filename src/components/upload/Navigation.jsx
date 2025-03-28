import { Link } from "@/components/ui/link";
import { ChevronRight } from "lucide-react";

const UploadNavigation = ({ currentView, onNavigate, selectedHistoryName }) => {
  return (
    <nav className="flex items-center text-sm">
      <Link
        href="#"
        onClick={() => onNavigate("history")}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        History
      </Link>

      {(currentView === "upload" ||
        currentView === "result" ||
        currentView === "consult") && (
        <>
          <ChevronRight className="mx-2 h-4 w-4 text-gray-500" />
          {currentView === "consult" ? (
            <Link
              href="#"
              onClick={() => onNavigate("consult")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedHistoryName || "Consult"}
            </Link>
          ) : (
            <Link
              href="#"
              onClick={() => onNavigate("upload")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Upload
            </Link>
          )}
        </>
      )}

      {currentView === "result" && (
        <>
          <ChevronRight className="mx-2 h-4 w-4 text-gray-500" />
          <Link
            href="#"
            onClick={() => onNavigate("result")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Result
          </Link>
        </>
      )}
    </nav>
  );
};

export default UploadNavigation;
