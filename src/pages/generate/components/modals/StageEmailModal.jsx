import { useEffect } from "react";
import CollapsibleSection from "../../../../components/CollapsibleSection";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-medium wrap-break-word">{value}</div>
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
        <InfoRow label="Kimga" value={safeTo || "—"} />
        <InfoRow label="Mavzu" value={safeSubject || "—"} />
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
          <iframe
            title="E-mail ko‘rinishi"
            className="w-full h-[420px] bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={safeHtml}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">
            HTML yo‘q (matn ko‘rinishi)
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
  canGenerateTelegramLink = false,
  autoTelegramGroupLabel = "",
}) {
  if (!open) return null;

  const showInfoPanel =
    (showAdditionalInfoEditor || previewRows.length > 0) &&
    (!showPreviewWhenAccepted || decision === "accepted");

  const resolvedLinkType =
    String(additionalInfoForm?.linkType || "").toLowerCase() || "zoom";
  const allowAutoGenerateTelegram =
    resolvedLinkType === "telegram" && Boolean(canGenerateTelegramLink);
  const useGeneratedLink = Boolean(additionalInfoForm?.useGeneratedLink);

  // If Telegram group is unset in Einstellungen (canGenerateTelegramLink=false),
  // ensure we don't keep a stale "auto-generate" selection that would later
  // block sending (Generate.jsx validates telegram group presence when enabled).
  useEffect(() => {
    if (!open) return;
    if (useGeneratedLink && !allowAutoGenerateTelegram) {
      setAdditionalInfoForm?.((prev) => ({
        ...(prev || {}),
        useGeneratedLink: false,
      }));
    }
  }, [
    open,
    useGeneratedLink,
    allowAutoGenerateTelegram,
    setAdditionalInfoForm,
  ]);

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
              <h3 className="text-lg font-bold">{title}</h3>
              {subtitle ? (
                <p className="text-sm opacity-70">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Yopish"
            >
              ✕
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
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
                    Ijobiy e-mail yuboriladi va keyingi bosqichga o‘tiladi.
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
                    <div className="font-semibold">Rad etish</div>
                  </div>
                  <p className="text-sm opacity-70">
                    Rad javobi e-mail yuboriladi. Keyingi bosqichga o‘tilmaydi.
                  </p>
                </div>
              </label>
            </div>

            {showInfoPanel && (
              <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                <div className="font-semibold">
                  {previewTitle || "E-mailga qo‘shiladigan ma’lumotlar"}
                </div>
                {showAdditionalInfoEditor ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label" htmlFor="stage-email-datetime">
                        <span className="label-text font-medium">
                          Sana / vaqt
                        </span>
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
                      <label className="label" htmlFor="stage-email-link">
                        <span className="label-text font-medium">Link</span>
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          id="stage-email-link-generate"
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={useGeneratedLink}
                          disabled={!allowAutoGenerateTelegram}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              useGeneratedLink: Boolean(e.target.checked),
                            }))
                          }
                        />
                        <label
                          htmlFor="stage-email-link-generate"
                          className={`text-sm ${
                            allowAutoGenerateTelegram ? "" : "opacity-60"
                          }`}
                        >
                          {allowAutoGenerateTelegram ? (
                            <span className="text-xs opacity-70">
                              Telegram guruh nomi:{" "}
                              <span className="font-semibold">
                                {String(autoTelegramGroupLabel || "—")}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs opacity-60">Guruh: —</span>
                          )}
                        </label>
                      </div>
                      <input
                        id="stage-email-link"
                        type="url"
                        className="input input-bordered w-full"
                        placeholder={
                          useGeneratedLink && allowAutoGenerateTelegram
                            ? "Invite link send paytida avtomatik yaratiladi"
                            : "https://..."
                        }
                        value={String(additionalInfoForm?.link || "")}
                        onChange={(e) =>
                          setAdditionalInfoForm?.((prev) => ({
                            ...(prev || {}),
                            link: e.target.value,
                          }))
                        }
                        disabled={useGeneratedLink && allowAutoGenerateTelegram}
                      />
                    </div>
                    <div className="form-control">
                      <label
                        className="label"
                        htmlFor="stage-email-locationName"
                      >
                        <span className="label-text font-medium">
                          Lokatsiya (nomi)
                        </span>
                      </label>
                      <input
                        id="stage-email-locationName"
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="z. B. ConsultingUZ Büro"
                        value={String(additionalInfoForm?.locationName || "")}
                        onChange={(e) =>
                          setAdditionalInfoForm?.((prev) => ({
                            ...(prev || {}),
                            locationName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label
                        className="label"
                        htmlFor="stage-email-locationUrl"
                      >
                        <span className="label-text font-medium">
                          Lokatsiya (URL)
                        </span>
                      </label>
                      <input
                        id="stage-email-locationUrl"
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
