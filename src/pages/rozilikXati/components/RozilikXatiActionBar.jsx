import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FaDownload, FaSave } from "react-icons/fa";

export default function RozilikXatiActionBar({
  isLoadingTemplate,
  isSavingTemplate,
  hasUnsavedTemplate,
  canWriteTemplate,
  isDownloading,
  onSave,
  onDownload,
}) {
  return (
    <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link
                to="/settings/documents"
                className="link flex items-center gap-2"
              >
                <FaArrowLeft /> Zurück
              </Link>
            </li>
            <li className="opacity-70">Rozilik xati</li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-base-content/60 hidden sm:inline">
            {isLoadingTemplate
              ? "Template yuklanmoqda..."
              : isSavingTemplate
              ? "Saqlanmoqda..."
              : hasUnsavedTemplate
              ? "O'zgarish bor"
              : "Saqlangan"}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onSave}
            disabled={
              isLoadingTemplate ||
              isSavingTemplate ||
              !hasUnsavedTemplate ||
              !canWriteTemplate
            }
            title={
              !canWriteTemplate
                ? "Saqlash uchun admin huquqi kerak"
                : isLoadingTemplate
                ? "Template yuklanmoqda..."
                : !hasUnsavedTemplate
                ? "O'zgarish yo'q"
                : "Saqlash"
            }
          >
            <FaSave />
            {isSavingTemplate ? "Saqlanmoqda..." : "Saqlash"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <FaDownload />
            {isDownloading ? "Wird geladen..." : "Herunterladen"}
          </button>
        </div>
      </div>
    </div>
  );
}
