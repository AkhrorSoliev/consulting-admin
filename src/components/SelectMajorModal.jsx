import { FiX, FiCheck } from "react-icons/fi";

export default function SelectMajorModal({
  open,
  majors,
  selectedKey,
  onSelectKey,
  onCancel,
  onConfirm,
  confirming,
  title = "Major tanlang",
  subtitle = "",
}) {
  if (!open) return null;

  const list = Array.isArray(majors) ? majors : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={() => {
          if (confirming) return;
          onCancel?.();
        }}
      />
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              {subtitle ? (
                <p className="text-sm opacity-70">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (confirming) return;
                onCancel?.();
              }}
              aria-label="Modal schließen"
            >
              ✕
            </button>
          </div>

          {list.length === 0 ? (
            <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
              Keine Berufsfelder verfügbar.
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-base-300 bg-base-100">
              <ul className="divide-y divide-base-200">
                {list.map((m) => {
                  const key = String(
                    m?.collectionName || m?.linkId || m?.id || ""
                  ).trim();
                  if (!key) return null;
                  const label = String(m?.title || m?.name || key).trim();
                  const secondary = String(m?.collectionName || "").trim();
                  const checked = String(selectedKey || "") === key;
                  return (
                    <li key={key} className="p-3 hover:bg-base-200/40">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          className="radio radio-primary mt-1"
                          name="select-major"
                          checked={checked}
                          onChange={() => onSelectKey?.(key)}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold break-words">
                            {label}
                          </div>
                          {secondary ? (
                            <div className="text-xs opacity-60 break-words">
                              {secondary}
                            </div>
                          ) : null}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (confirming) return;
                onCancel?.();
              }}
              disabled={confirming}
            >
              <FiX size={18} />
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={confirming || !String(selectedKey || "").trim()}
            >
              {confirming ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Wird wiederhergestellt...
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  Bestätigen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
