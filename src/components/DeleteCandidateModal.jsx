import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiTrash2, FiX } from "react-icons/fi";

export default function DeleteCandidateModal({
  open,
  onClose,
  // Prefer explicit handlers:
  onDelete,
  onArchive,
  // Backward-compat: older callsites may still pass `onConfirm`
  onConfirm,
  candidateName,
  seconds = 5,
  isDeleting = false,
  cancelLabel = "Abbrechen",
  archiveLabel = "Archivieren",
  deleteLabel = "Löschen",
}) {
  const displayName = useMemo(() => {
    const n = String(candidateName || "").trim();
    return n || "Kandidat";
  }, [candidateName]);

  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [pendingAction, setPendingAction] = useState("");

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(seconds);
    setPendingAction("");
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, seconds]);

  if (!open) return null;

  const canDelete = secondsLeft <= 0 && !isDeleting;
  const canArchive = secondsLeft <= 0 && !isDeleting;
  const hasArchive = typeof onArchive === "function";
  const deleteHandler = typeof onDelete === "function" ? onDelete : onConfirm;
  const isArchiveLoading = Boolean(isDeleting && pendingAction === "archive");
  const isDeleteLoading = Boolean(isDeleting && pendingAction === "delete");
  const archiveText = archiveLabel;
  const deleteText = deleteLabel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={() => {
          if (!isDeleting) onClose?.();
        }}
      />
      <div
        className="relative w-full max-w-md mx-4"
        role="dialog"
        aria-modal="true"
        aria-label={
          hasArchive
            ? "Bestätigung: Kandidat archivieren oder löschen"
            : "Bestätigung: Kandidat löschen"
        }
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-error">
                {hasArchive ? "Kandidat archivieren oder löschen?" : "Kandidat löschen?"}
              </h3>
              <p className="text-sm opacity-70 mt-1">
                {hasArchive ? (
                  <>
                    <strong>{displayName}</strong> kann archiviert (wiederherstellbar)
                    oder unwiderruflich gelöscht werden.
                  </>
                ) : (
                  <>
                    <strong>{displayName}</strong> wird unwiderruflich gelöscht.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => !isDeleting && onClose?.()}
              aria-label="Modal schließen"
            >
              ✕
            </button>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-200/40 p-3 text-sm">
            {secondsLeft > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="opacity-80">
                  Aus Sicherheitsgründen werden Aktionen erst nach Ablauf der Wartezeit aktiv.
                </div>
                <div className="badge badge-warning badge-outline">
                  {secondsLeft}s
                </div>
              </div>
            ) : (
              <div className="opacity-80">
                Sie können jetzt fortfahren.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn"
              onClick={() => onClose?.()}
              disabled={isDeleting}
            >
              <span className="inline-flex items-center gap-2">
                <FiX className="w-4 h-4" aria-hidden="true" focusable="false" />
                {cancelLabel}
              </span>
            </button>
            {hasArchive ? (
              <button
                type="button"
                className="btn btn-warning btn-outline"
                disabled={!canArchive}
                onClick={() => {
                  setPendingAction("archive");
                  onArchive?.();
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {isArchiveLoading ? (
                    <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                  ) : (
                    <FiArchive className="w-4 h-4" aria-hidden="true" focusable="false" />
                  )}
                  {archiveText}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-error"
              disabled={!canDelete}
              onClick={() => {
                setPendingAction("delete");
                deleteHandler?.();
              }}
            >
              <span className="inline-flex items-center gap-2">
                {isDeleteLoading ? (
                  <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                ) : (
                  <FiTrash2 className="w-4 h-4" aria-hidden="true" focusable="false" />
                )}
                {deleteText}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


