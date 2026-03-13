import { FaDownload, FaSave, FaTrash, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function HeaderBar({
  canManageDefaults,
  isSavingDefaults,
  hasDefaults,
  isClearingDefaults,
  isDownloading,
  onSaveDefaults,
  onClearDefaults,
  onDownloadPdf,
}) {
  return (
    <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link to="/settings/documents" className="link flex items-center gap-2">
                <FaArrowLeft /> Zurück
              </Link>
            </li>
            <li className="opacity-70">Beschäftigungsverhältnis (Yangi)</li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          {canManageDefaults && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline btn-secondary"
                onClick={onSaveDefaults}
                disabled={isSavingDefaults}
              >
                <FaSave className="w-3 h-3" />{" "}
                {isSavingDefaults ? "Speichern..." : "Als Standard speichern"}
              </button>
              {hasDefaults && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  onClick={onClearDefaults}
                  disabled={isClearingDefaults}
                >
                  <FaTrash className="w-3 h-3" />{" "}
                  {isClearingDefaults ? "Löschen..." : "Standard löschen"}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onDownloadPdf}
            disabled={isDownloading}
          >
            <FaDownload /> {isDownloading ? "Wird erstellt..." : "PDF Herunterladen"}
          </button>
        </div>
      </div>
    </div>
  );
}
