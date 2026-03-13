import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaDownload,
  FaPaperPlane,
  FaSave,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import CandidateRating from "./CandidateRating";

export default function ActionBar({
  resolvedMajor,
  major,
  id,
  rating,
  handleRatingChange,
  handleRatingReset,
  canRate,
  reaction,
  handleReaction,
  isSuperAdmin,
  handleSave,
  handleCancel,
  isSaving,
  hasUnsavedChanges,
  handleDownloadPdf,
  isDownloading,
  showBackgroundImage,
  setShowBackgroundImage,
  handleDocumentReady,
  handleDocumentSend,
  docCv,
  loading,
  notFound,
  remoteMode,
  isLimitedAdmin,
  showLimitedAdminSaveButton,
}) {
  return (
    <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link
                to={`/collectionCv/${resolvedMajor.linkId || major}`}
                className="link flex items-center gap-2"
              >
                <FaArrowLeft /> Zurück
              </Link>
            </li>
            <li className="opacity-70">CV</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          {!remoteMode && !loading && !notFound && (
            <div className="flex items-center gap-2">
              <CandidateRating
                value={rating}
                onChange={handleRatingChange}
                onReset={handleRatingReset}
                disabled={loading || notFound || !canRate}
                canRate={canRate}
                inputName={`rating-${id || "candidate"}`}
              />
              <button
                type="button"
                className={[
                  "btn btn-sm btn-circle",
                  reaction === "like"
                    ? "btn-success text-white"
                    : "btn-ghost hover:btn-success hover:text-white",
                  !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
                onClick={() => handleReaction("like")}
                title={
                  isSuperAdmin ? "Gefällt mir" : "Faqat super_admin uchun"
                }
                disabled={loading || notFound || !isSuperAdmin}
              >
                <FaThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className={[
                  "btn btn-sm btn-circle",
                  reaction === "dislike"
                    ? "btn-error text-white"
                    : "btn-ghost hover:btn-error hover:text-white",
                  !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
                onClick={() => handleReaction("dislike")}
                title={
                  isSuperAdmin
                    ? "Gefällt mir nicht"
                    : "Faqat super_admin uchun"
                }
                disabled={loading || notFound || !isSuperAdmin}
              >
                <FaThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {(!isLimitedAdmin || showLimitedAdminSaveButton) && !remoteMode && (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSave}
                disabled={
                  isSaving || loading || notFound || !hasUnsavedChanges
                }
              >
                <FaSave />
                <span>Speichern</span>
              </button>
              <button
                className="btn btn-sm"
                onClick={handleCancel}
                disabled={
                  isSaving || loading || notFound || !hasUnsavedChanges
                }
              >
                Abbrechen
              </button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="toggle toggle-xs toggle-primary"
                    checked={showBackgroundImage}
                    onChange={(e) => setShowBackgroundImage(e.target.checked)}
                  />
                  <span className="hidden sm:inline">Watermark</span>
                </label>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadPdf}
                  disabled={loading || notFound || isDownloading}
                >
                  <FaDownload />{" "}
                  {isDownloading ? "Wird geladen..." : "Herunterladen"}
                </button>
              </div>
              <button
                className={[
                  "btn btn-sm",
                  docCv?.documentReady ? "btn-success" : "btn-outline",
                ].join(" ")}
                onClick={handleDocumentReady}
                disabled={loading || notFound || remoteMode}
                title={
                  docCv?.documentReady
                    ? "Dokument als nicht bereit markieren"
                    : "Dokument als bereit markieren"
                }
              >
                <HiMiniDocumentCheck />
                <span className="hidden sm:inline">
                  {docCv?.documentReady ? "Bereit" : "Als Bereit Markieren"}
                </span>
              </button>
              <button
                className={[
                  "btn btn-sm",
                  docCv?.isDocumentSend ? "btn-info" : "btn-outline",
                ].join(" ")}
                onClick={handleDocumentSend}
                disabled={loading || notFound || remoteMode}
                title={
                  docCv?.isDocumentSend
                    ? "Dokument als nicht gesendet markieren"
                    : "Dokument als gesendet markieren"
                }
              >
                <FaPaperPlane />
                <span className="hidden sm:inline">
                  {docCv?.isDocumentSend ? "Gesendet" : "Als Gesendet"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
