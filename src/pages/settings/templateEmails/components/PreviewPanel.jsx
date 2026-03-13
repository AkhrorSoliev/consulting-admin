import EmailPreview from "./EmailPreview";

export default function PreviewPanel({ preview, previewMode, setPreviewMode }) {
  return (
    <div className="space-y-3 min-w-0 lg:sticky lg:top-4">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="font-semibold shrink-0">Vorschau</div>
        <div className="text-xs text-base-content/60 flex-1 min-w-0 text-right truncate">
          Diese Vorschau verwendet nur Beispieldaten.
        </div>
      </div>

      <div className="tabs tabs-boxed w-full">
        <button
          type="button"
          className={`tab ${previewMode === "html" ? "tab-active" : ""}`}
          onClick={() => setPreviewMode("html")}
        >
          HTML
        </button>
        <button
          type="button"
          className={`tab ${previewMode === "text" ? "tab-active" : ""}`}
          onClick={() => setPreviewMode("text")}
        >
          Text
        </button>
      </div>

      {previewMode === "html" ? (
        <div className="max-h-[70vh] overflow-auto rounded-box">
          <EmailPreview
            to={preview?.to}
            subject={preview?.subject}
            htmlContent={preview?.htmlContent}
            message={preview?.message}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs opacity-60">An</div>
              <div className="font-medium wrap-break-word">
                {String(preview?.to || "").trim() || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-60">Betreff</div>
              <div className="font-medium wrap-break-word">
                {String(preview?.subject || "").trim() || "—"}
              </div>
            </div>
          </div>
          <div className="divider my-3" />
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {String(preview?.message || "").trim() || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}
