import { useMemo } from "react";
import CollapsibleSection from "../../../../components/CollapsibleSection";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

function EmailPreview({ subject, to, htmlContent, message }) {
  const safeSubject = String(subject || "").trim();
  const safeTo = String(to || "").trim();
  const safeHtml = String(htmlContent || "").trim();
  const safeMsg = String(message || "").trim();

  const inlineBodyHtml = useMemo(() => {
    if (!safeHtml) return "";
    // Smooth preview (no iframe reload): extract <body> and render inline.
    try {
      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeHtml, "text/html");
        const inner = doc?.body?.innerHTML;
        if (typeof inner === "string") return inner;
      }
    } catch {
      // ignore and fallback below
    }
    const m = safeHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (m && typeof m[1] === "string") return m[1];
    return safeHtml;
  }, [safeHtml]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="To" value={safeTo || "—"} />
        <InfoRow label="Subject" value={safeSubject || "—"} />
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-white overflow-hidden">
          <div className="w-full h-[420px] overflow-auto p-4">
            <div
              className="min-h-full"
              dangerouslySetInnerHTML={{ __html: inlineBodyHtml }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">HTML yo&apos;q (text)</div>
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

  const ph = placeholders && typeof placeholders === "object" ? placeholders : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-lg font-bold">Custom email yuborish</h3>
              <p className="text-sm opacity-70">
                Matn yozganingiz zahoti preview yangilanadi (collapse ichida).
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>

          <form
            className="space-y-4 flex-1 overflow-y-auto pr-1 mt-4"
            onSubmit={onSubmit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label" htmlFor="custom-email-to">
                  <span className="label-text font-medium">To</span>
                </label>
                <input
                  id="custom-email-to"
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="Kandidat email manzili (masalan: candidate@example.com)"
                  value={String(form?.to || "")}
                  onChange={(e) =>
                    setForm?.((prev) => ({ ...(prev || {}), to: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="custom-email-title">
                <span className="label-text font-medium">
                  Ariza holati yangilandi (sarlavha)
                </span>
              </label>
              <input
                id="custom-email-title"
                type="text"
                className="input input-bordered w-full"
                placeholder={String(ph.emailTitle || "Ariza holati yangilandi")}
                value={String(form?.emailTitle || "")}
                onChange={(e) =>
                  setForm?.((prev) => ({
                    ...(prev || {}),
                    emailTitle: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="custom-email-subject">
                <span className="label-text font-medium">Subject</span>
              </label>
              <input
                id="custom-email-subject"
                type="text"
                className="input input-bordered w-full"
                placeholder={String(ph.subject || "Mavzu...")}
                value={String(form?.subject || "")}
                onChange={(e) =>
                  setForm?.((prev) => ({
                    ...(prev || {}),
                    subject: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="custom-email-bodyText">
                <span className="label-text font-medium">
                  Matn (1-paragraf = asosiy, keyingi paragraf = keyingi qadam)
                </span>
              </label>
              <textarea
                id="custom-email-bodyText"
                className="textarea textarea-bordered w-full min-h-[220px]"
                placeholder={String(
                  ph.bodyText ||
                    "Asosiy matn...\n\nKeyingi qadam (note)..."
                )}
                value={String(form?.bodyText || "")}
                onChange={(e) =>
                  setForm?.((prev) => ({
                    ...(prev || {}),
                    bodyText: e.target.value,
                  }))
                }
              />
            </div>

            <CollapsibleSection
              title="Email preview (live)"
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

            <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-base-100">
              <button type="button" className="btn" onClick={onClose}>
                Bekor qilish
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={Boolean(isSending)}
              >
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Yuborilmoqda...
                  </>
                ) : (
                  "Jo'natish"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


