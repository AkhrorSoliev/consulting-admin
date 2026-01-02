import { useEffect } from "react";
import { FaEnvelope, FaTelegram } from "react-icons/fa";
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
        <InfoRow label="An" value={safeTo || "—"} />
        <InfoRow label="Betreff" value={safeSubject || "—"} />
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
          <iframe
            title="E-Mail-Vorschau"
            className="w-full h-64 sm:h-80 md:h-96 bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={safeHtml}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">Kein HTML (Textansicht)</div>
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
  examples = null,
  selectedExample,
  setSelectedExample,
  hasTelegramId = false,
}) {
  if (!open) return null;

  const showInfoPanel =
    ((showAdditionalInfoEditor || previewRows.length > 0) &&
      (!showPreviewWhenAccepted || decision === "accepted")) ||
    (decision === "accepted" &&
      examples &&
      examples.length > 0 &&
      selectedExample === "example2");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden p-4">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col h-full max-h-[90vh]">
          <div className="flex items-start justify-between gap-3 shrink-0 p-6 pb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{title}</h3>
                <div className="flex items-center gap-1.5">
                  <FaEnvelope
                    className="w-4 h-4 text-primary"
                    title="Wird per E-Mail gesendet"
                  />
                  {hasTelegramId && (
                    <FaTelegram
                      className="w-4 h-4 text-[#0088cc]"
                      title="Wird auch per Telegram gesendet"
                    />
                  )}
                </div>
              </div>
              {subtitle ? (
                <p className="text-sm opacity-70">{subtitle}</p>
              ) : null}
              {hasTelegramId && (
                <p className="text-xs text-[#0088cc] mt-1 flex items-center gap-1">
                  <FaTelegram className="w-3 h-3" />
                  Nachricht wird auch per Telegram gesendet
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          <form
            className="flex flex-col flex-1 overflow-hidden"
            onSubmit={onSubmit}
          >
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
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
                      <div className="font-semibold">Annehmen</div>
                    </div>
                    <p className="text-sm opacity-70">
                      Positive E-Mail wird gesendet und zur nächsten Stufe
                      übergegangen.
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
                      <div className="font-semibold">Ablehnen</div>
                    </div>
                    <p className="text-sm opacity-70">
                      Ablehnungs-E-Mail wird gesendet. Es wird nicht zur
                      nächsten Stufe übergegangen.
                    </p>
                  </div>
                </label>
              </div>

              {decision === "accepted" && examples && examples.length > 0 && (
                <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                  <div className="font-semibold">E-Mail-Inhalt auswählen:</div>
                  <div className="space-y-2">
                    {examples.map((example) => (
                      <label
                        key={example.id}
                        className={`card border transition cursor-pointer ${
                          selectedExample === example.id
                            ? "border-primary bg-primary/5"
                            : "border-base-300 hover:border-primary/60"
                        }`}
                      >
                        <div className="card-body p-3 gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="example-selection"
                              className="radio radio-primary"
                              value={example.id}
                              checked={selectedExample === example.id}
                              onChange={() => setSelectedExample?.(example.id)}
                            />
                            <div className="font-semibold text-sm">
                              {example.title}
                            </div>
                          </div>
                          {/* content hidden intentionally */}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showInfoPanel && (
                <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                  <div className="font-semibold">
                    {previewTitle || "Zur E-Mail hinzuzufügende Informationen"}
                  </div>
                  {showAdditionalInfoEditor ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label" htmlFor="stage-email-datetime">
                          <span className="label-text font-medium">
                            Datum / Uhrzeit
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
                        <div className="flex items-center gap-2">
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
                                  Telegram-Gruppenname:{" "}
                                  <span className="font-semibold">
                                    {String(autoTelegramGroupLabel || "—")}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs opacity-60">
                                  Gruppe: —
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                        <input
                          id="stage-email-link"
                          type="url"
                          className="input input-bordered w-full"
                          placeholder={
                            useGeneratedLink && allowAutoGenerateTelegram
                              ? "Einladungslink wird beim Senden automatisch erstellt"
                              : "https://..."
                          }
                          value={String(additionalInfoForm?.link || "")}
                          onChange={(e) =>
                            setAdditionalInfoForm?.((prev) => ({
                              ...(prev || {}),
                              link: e.target.value,
                            }))
                          }
                          disabled={
                            useGeneratedLink && allowAutoGenerateTelegram
                          }
                        />
                      </div>
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="stage-email-locationName"
                        >
                          <span className="label-text font-medium">
                            Standort (Name)
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
                            Standort (URL)
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

              <div className="flex justify-end gap-2 pt-2 shrink-0 px-6 pb-6">
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
