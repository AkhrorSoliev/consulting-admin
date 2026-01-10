import { FaEnvelope, FaTelegram, FaPaperPlane } from "react-icons/fa";

export default function SendDocumentLinkModal({
  open,
  onClose,
  onSubmit,
  isSending,
  candidateEmail,
  hasTelegramId,
  documentLink,
}) {
  if (!open) return null;

  const hasEmail = Boolean(candidateEmail);
  const canSend = hasEmail || hasTelegramId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden p-4">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col h-full max-h-[90vh]">
          <div className="flex items-start justify-between gap-3 shrink-0 p-6 pb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FaPaperPlane className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Dokument-Link senden</h3>
              </div>
              <p className="text-sm opacity-70 mt-1">
                Link wird an die E-Mail und/oder Telegram des Kandidaten
                gesendet
              </p>
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
              <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                <div className="font-semibold text-sm">Ziel:</div>
                <div className="text-sm opacity-80">
                  Dieser Link wird an den Kandidaten gesendet, damit er seine
                  Dokumente hochladen kann.
                </div>
              </div>

              <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                <div className="font-semibold text-sm">Link:</div>
                <div className="text-xs break-all bg-base-100 p-2 rounded border border-base-300">
                  {documentLink}
                </div>
              </div>

              <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
                <div className="font-semibold text-sm">Empfänger:</div>
                <div className="space-y-2">
                  {hasEmail ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FaEnvelope className="w-4 h-4 text-primary" />
                      <span className="font-medium">E-Mail:</span>
                      <span className="opacity-80">{candidateEmail}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm opacity-60">
                      <FaEnvelope className="w-4 h-4" />
                      <span>Keine E-Mail-Adresse vorhanden</span>
                    </div>
                  )}
                  {hasTelegramId ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FaTelegram className="w-4 h-4 text-[#0088cc]" />
                      <span className="font-medium">Telegram:</span>
                      <span className="text-[#0088cc]">Verbunden</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm opacity-60">
                      <FaTelegram className="w-4 h-4" />
                      <span>Kein Telegram verbunden</span>
                    </div>
                  )}
                </div>
              </div>

              {!canSend && (
                <div className="alert alert-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>
                    Kandidat hat weder E-Mail noch Telegram. Link kann nicht
                    gesendet werden.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 shrink-0 px-6 pb-6 border-t border-base-300 pt-4">
              <button type="button" className="btn" onClick={onClose}>
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={!canSend || isSending}
              >
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Link senden
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
