export default function MotivationLetterToggleCard({
  checked,
  busy,
  disabled,
  onToggle,
  onRegenerate,
  uploadUrl,
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">Motivationsschreiben (Deutsch)</div>
          <div className="text-xs text-base-content/60 mt-1">
            KI-generiertes Motivationsschreiben fuer die deutsche Botschaft (1x A4, PDF).
          </div>
          {String(uploadUrl || "").trim() ? (
            <div className="text-xs text-base-content/60 mt-1">
              Upload: {" "}
              <a className="link" href={String(uploadUrl)} target="_blank" rel="noreferrer">
                Link
              </a>
            </div>
          ) : null}
          {checked ? (
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={onRegenerate}
                disabled={disabled}
                title="PDF neu generieren und erneut hochladen"
              >
                Neu generieren
              </button>
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 shrink-0">
          {busy ? <span className="loading loading-spinner loading-sm" /> : null}
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={Boolean(checked)}
            onChange={(e) => onToggle?.(e.target.checked)}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
