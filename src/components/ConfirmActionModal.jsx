import { useEffect, useMemo, useState } from "react";

function toBtnClass(variant) {
  const v = String(variant || "").trim().toLowerCase();
  if (v === "error" || v === "danger" || v === "destructive")
    return "btn btn-error";
  if (v === "warning") return "btn btn-warning";
  if (v === "success") return "btn btn-success";
  if (v === "outline") return "btn btn-outline";
  return "btn btn-primary";
}

export default function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title = "Tasdiqlash",
  message = "",
  confirmLabel = "Tasdiqlash",
  confirmVariant = "primary",
  seconds = 0,
  busy = false,
}) {
  const initialSeconds = Math.max(0, Number(seconds) || 0);
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (!open) return;
    setRemaining(initialSeconds);
  }, [open, initialSeconds]);

  useEffect(() => {
    if (!open) return;
    if (busy) return;
    if (remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [open, busy, remaining]);

  const canConfirm = useMemo(() => {
    if (!open) return false;
    if (busy) return false;
    return remaining <= 0;
  }, [open, busy, remaining]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={() => {
          if (busy) return;
          onClose?.();
        }}
      />
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              {message ? (
                <p className="text-sm opacity-70 mt-1">{message}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (busy) return;
                onClose?.();
              }}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>

          {remaining > 0 ? (
            <div className="rounded-lg border border-base-300 bg-base-200/60 p-3 text-sm">
              Tasdiqlash tugmasi {remaining} soniyadan keyin faollashadi.
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (busy) return;
                onClose?.();
              }}
              disabled={busy}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className={toBtnClass(confirmVariant)}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              {busy ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Kuting...
                </>
              ) : remaining > 0 ? (
                `${confirmLabel} (${remaining})`
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


