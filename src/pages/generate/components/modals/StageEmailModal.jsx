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
          <div className="text-xs opacity-60 mb-2">
            HTML yo&apos;q (text preview)
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {safeMsg || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function StageEmailModal({
  open,
  onClose,
  title,
  subtitle,
  decision,
  setDecision,
  onSubmit,
  isSending,
  previewTitle,
  previewRows = [],
  showPreviewWhenAccepted = true,
  showAdditionalInfoEditor = false,
  additionalInfoForm,
  setAdditionalInfoForm,
  emailPreview,
}) {
  if (!open) return null;

  const linkType =
    additionalInfoForm?.linkType === "telegram" ? "telegram" : "zoom";
  const linkLabel =
    linkType === "telegram" ? "Telegram link" : "Zoom link";

  const showInfoPanel =
    (showAdditionalInfoEditor || previewRows.length > 0) &&
    (!showPreviewWhenAccepted || decision === "accepted");

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
              <h3 className="text-lg font-bold">{title}</h3>
              {subtitle ? (
                <p className="text-sm opacity-70">{subtitle}</p>
              ) : null}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`card border transition cursor-pointer ${
                  decision === "accepted"
                    ? "border-success bg-success/5"
                    : "border-base-300 hover:border-success/60"
                }`}
              >
                <div className="card-body p-4 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stage-decision"
                      className="radio radio-success"
                      value="accepted"
                      checked={decision === "accepted"}
                      onChange={() => setDecision?.("accepted")}
                    />
                    <div className="font-semibold">Qabul qilish</div>
                  </div>
                  <p className="text-sm opacity-70">
                    Ijobiy email yuboriladi va keyingi bosqich ochiladi.
                  </p>
                </div>
              </label>

              <label
                className={`card border transition cursor-pointer ${
                  decision === "rejected"
                    ? "border-error bg-error/5"
                    : "border-base-300 hover:border-error/60"
                }`}
              >
                <div className="card-body p-4 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stage-decision"
                      className="radio radio-error"
                      value="rejected"
                      checked={decision === "rejected"}
                      onChange={() => setDecision?.("rejected")}
                    />
                    <div className="font-semibold">Rad qilish</div>
                  </div>
                  <p className="text-sm opacity-70">
                    Salbiy email yuboriladi. Keyingi bosqichga o&apos;tmaydi.
                  </p>
                </div>
              </label>
            </div>

            {showInfoPanel && (
              <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                <div className="font-semibold">
                  {previewTitle || "Emailga qo'shiladigan ma'lumotlar"}
                </div>
                {showAdditionalInfoEditor ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label" htmlFor="stage-email-datetime">
                          <span className="label-text font-medium">Vaqt</span>
                        </label>
                        <input
                          id="stage-email-datetime"
                          type="datetime-local"
                          className="input input-bordered w-full"
                          value={String(additionalInfoForm?.dateTime || "")}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              dateTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-control">
                        <div className="label flex items-center justify-between">
                          <span className="label-text font-medium">
                            Uchrashuv havolasi
                          </span>
                          <div className="join join-sm">
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                linkType === "zoom" ? "btn-primary" : "btn-ghost"
                              }`}
                              onClick={() =>
                                setAdditionalInfoForm?.((prev) => ({
                                  ...(prev || {}),
                                  linkType: "zoom",
                                }))
                              }
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                linkType === "telegram"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() =>
                                setAdditionalInfoForm?.((prev) => ({
                                  ...(prev || {}),
                                  linkType: "telegram",
                                }))
                              }
                            >
                              Telegram
                            </button>
                          </div>
                        </div>
                        <input
                          id="stage-email-link"
                          type="url"
                          className="input input-bordered w-full"
                          placeholder={
                            linkType === "telegram"
                              ? "https://t.me/..."
                              : "https://zoom.us/j/..."
                          }
                          value={String(additionalInfoForm?.link || "")}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              link: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs opacity-60 mt-1">
                          Emailda “{linkLabel}” sifatida ko&apos;rsatiladi.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label" htmlFor="stage-email-location-name">
                          <span className="label-text font-medium">
                            Lokatsiya nomi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="stage-email-location-name"
                          type="text"
                          className="input input-bordered w-full"
                          placeholder="Masalan: ConsultingUZ ofisi"
                          value={String(additionalInfoForm?.locationName || "")}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              locationName: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs opacity-60 mt-1">
                          Oflayn uchrashuv bo&apos;lsa joy nomini kiriting.
                        </p>
                      </div>
                      <div className="form-control">
                        <label className="label" htmlFor="stage-email-location-url">
                          <span className="label-text font-medium">
                            Lokatsiya havolasi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="stage-email-location-url"
                          type="url"
                          className="input input-bordered w-full"
                          placeholder="https://maps.app.goo.gl/..."
                          value={String(additionalInfoForm?.locationUrl || "")}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              locationUrl: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs opacity-60 mt-1">
                          Havola bo&apos;lmasa faqat nomni qoldirish mumkin.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewRows.map((row) => (
                      <InfoRow
                        key={`${row.label}-${row.value}`}
                        label={row.label}
                        value={row.value}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {emailPreview ? (
              <CollapsibleSection
                title="Email preview (qanday ko‘rinishda boradi)"
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

            <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-base-100">
              <button
                type="button"
                className="btn"
                onClick={onClose}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="btn btn-primary"
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


