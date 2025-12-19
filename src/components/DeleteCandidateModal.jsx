import { useEffect, useMemo, useState } from "react";

export default function DeleteCandidateModal({
  open,
  onClose,
  onConfirm,
  candidateName,
  seconds = 5,
  isDeleting = false,
}) {
  const displayName = useMemo(() => {
    const n = String(candidateName || "").trim();
    return n || "Kandidat";
  }, [candidateName]);

  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(seconds);
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, seconds]);

  if (!open) return null;

  const canDelete = secondsLeft <= 0 && !isDeleting;

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
        aria-label="Delete candidate confirmation"
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-error">
                Kandidat löschen?
              </h3>
              <p className="text-sm opacity-70 mt-1">
                <strong>{displayName}</strong> wird unwiderruflich gelöscht.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => !isDeleting && onClose?.()}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-200/40 p-3 text-sm">
            {secondsLeft > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="opacity-80">
                  Xavfsizlik uchun “Delete” {secondsLeft}s dan keyin aktiv bo‘ladi.
                </div>
                <div className="badge badge-warning badge-outline">
                  {secondsLeft}s
                </div>
              </div>
            ) : (
              <div className="opacity-80">
                Endi “Delete” tugmasini bosib o‘chirishni tasdiqlashingiz mumkin.
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
              Bekor qilish
            </button>
            <button
              type="button"
              className="btn btn-error"
              disabled={!canDelete}
              onClick={() => onConfirm?.()}
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  O&apos;chirilmoqda...
                </>
              ) : secondsLeft > 0 ? (
                `Delete (${secondsLeft}s)`
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


