import CollapsibleSection from "../../../../components/CollapsibleSection";

function InfoRow({ label, value }) {
  if (value === undefined || value === null) return null;
  const safe = String(value || "").trim();
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-medium wrap-break-word">{safe || "—"}</div>
    </div>
  );
}

function EmailPreview({ subject, to, htmlContent, message }) {
  const safeSubject = String(subject || "").trim();
  const safeTo = String(to || "").trim();
  const safeHtml = String(htmlContent || "").trim();
  const safeMsg = String(message || "").trim();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="An" value={safeTo} />
        <InfoRow label="Betreff" value={safeSubject} />
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
          <iframe
            title="E-Mail-Vorschau"
            className="w-full h-[420px] bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={safeHtml}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">
            Kein HTML (Textvorschau)
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {safeMsg || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function CustomEmailModal({
  open,
  onClose,
  onSubmit,
  isSending,
  form,
  setForm,
  emailPreview,
  placeholders,
}) {
  if (!open) return null;

  const safeForm = form || {};
  const safePlaceholders = placeholders || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Benutzerdefinierte E-Mail senden
              </h3>
              <p className="text-sm opacity-70">
                Schreiben Sie Betreff und Text selbst. Wenn Felder leer bleiben,
                werden die Standardtexte verwendet.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modal schließen"
            >
              ✕
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label" htmlFor="custom-email-to">
                  <span className="label-text font-medium">An</span>
                </label>
                <input
                  id="custom-email-to"
                  type="email"
                  className="input input-bordered w-full"
                  value={String(safeForm.to || "")}
                  placeholder="nomzod@email.com"
                  onChange={(e) =>
                    setForm?.((prev) => ({
                      ...(prev || {}),
                      to: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="custom-email-title">
                  <span className="label-text font-medium">E-Mail-Titel</span>
                </label>
                <input
                  id="custom-email-title"
                  type="text"
                  className="input input-bordered w-full"
                  value={String(safeForm.emailTitle || "")}
                  placeholder={String(safePlaceholders.emailTitle || "")}
                  onChange={(e) =>
                    setForm?.((prev) => ({
                      ...(prev || {}),
                      emailTitle: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="custom-email-subject">
                <span className="label-text font-medium">Betreff</span>
              </label>
              <input
                id="custom-email-subject"
                type="text"
                className="input input-bordered w-full"
                value={String(safeForm.subject || "")}
                placeholder={String(safePlaceholders.subject || "")}
                onChange={(e) =>
                  setForm?.((prev) => ({
                    ...(prev || {}),
                    subject: e.target.value,
                  }))
                }
              />
              <div className="text-xs opacity-60 mt-1">
                Optional: Wenn leer, wird der Standard-Betreff verwendet.
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="custom-email-body">
                <span className="label-text font-medium">Text</span>
              </label>
              <textarea
                id="custom-email-body"
                className="textarea textarea-bordered w-full min-h-[160px]"
                value={String(safeForm.bodyText || "")}
                placeholder={String(safePlaceholders.bodyText || "")}
                onChange={(e) =>
                  setForm?.((prev) => ({
                    ...(prev || {}),
                    bodyText: e.target.value,
                  }))
                }
              />
              <div className="text-xs opacity-60 mt-1">
                Tipp: Trennen Sie „Haupttext“ und „Nächster Schritt“ mit{" "}
                <span className="font-mono">\n\n</span>.
              </div>
            </div>

            {emailPreview ? (
              <CollapsibleSection
                title="E-Mail-Vorschau (so wird sie aussehen)"
                defaultOpen={false}
                className="bg-base-200/60"
              >
                <EmailPreview
                  to={emailPreview?.to}
                  subject={emailPreview?.subject}
                  htmlContent={emailPreview?.htmlContent}
                  message={emailPreview?.message}
                />
              </CollapsibleSection>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Wird gesendet...
                  </>
                ) : (
                  "Senden"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
