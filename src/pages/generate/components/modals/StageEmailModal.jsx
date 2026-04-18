import { useEffect } from "react";
import { FaEnvelope, FaTelegram } from "react-icons/fa";
import CollapsibleSection from "../../../../components/CollapsibleSection";
import DecisionCards from "./stageEmail/DecisionCards";
import ExampleSelector from "./stageEmail/ExampleSelector";
import AdditionalInfoPanel from "./stageEmail/AdditionalInfoPanel";
import EmailPreview from "./stageEmail/EmailPreview";
import DecisionNoteField from "./stageEmail/DecisionNoteField";

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
  decisionNote = "",
  setDecisionNote,
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
          <ModalHeader
            title={title}
            subtitle={subtitle}
            hasTelegramId={hasTelegramId}
            onClose={onClose}
          />

          <form
            className="flex flex-col flex-1 overflow-hidden"
            onSubmit={onSubmit}
          >
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
              <DecisionCards decision={decision} setDecision={setDecision} />

              {decision === "accepted" && examples && examples.length > 0 && (
                <ExampleSelector
                  examples={examples}
                  selectedExample={selectedExample}
                  setSelectedExample={setSelectedExample}
                />
              )}

              {showInfoPanel && (
                <AdditionalInfoPanel
                  previewTitle={previewTitle}
                  showAdditionalInfoEditor={showAdditionalInfoEditor}
                  additionalInfoForm={additionalInfoForm}
                  setAdditionalInfoForm={setAdditionalInfoForm}
                  previewRows={previewRows}
                  useGeneratedLink={useGeneratedLink}
                  allowAutoGenerateTelegram={allowAutoGenerateTelegram}
                  autoTelegramGroupLabel={autoTelegramGroupLabel}
                />
              )}

              <DecisionNoteField
                decision={decision}
                decisionNote={decisionNote}
                setDecisionNote={setDecisionNote}
              />

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

function ModalHeader({ title, subtitle, hasTelegramId, onClose }) {
  return (
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
  );
}
