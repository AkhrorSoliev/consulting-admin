import { useEffect } from "react";

export default function UnsavedChangesModal({
  open,
  title = "Saqlanmagan o‘zgarishlar bor",
  message = "Sizda saqlanmagan o‘zgarishlar bor. Agar davom etsangiz, o‘zgarishlar yo‘qoladi.",
  stayText = "Qolish",
  leaveText = "Davom etish",
  onStay,
  onLeave,
  isBusy = false,
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        // Escape = stay (cancel navigation)
        if (!isBusy) onStay?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onStay, isBusy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div className="absolute inset-0 bg-base-content/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-4"
        role="dialog"
        aria-modal="true"
        aria-label="Unsaved changes confirmation"
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-warning">{title}</h3>
              <p className="text-sm opacity-80 mt-1">{message}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => !isBusy && onStay?.()}
              aria-label="Modalni yopish"
              disabled={isBusy}
            >
              ✕
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn"
              onClick={() => onStay?.()}
              disabled={isBusy}
            >
              {stayText}
            </button>
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onLeave?.()}
              disabled={isBusy}
            >
              {leaveText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



