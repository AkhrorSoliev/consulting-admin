import {
  FaPaperPlane,
  FaFileAlt,
  FaVideo,
  FaTelegramPlane,
} from "react-icons/fa";

/**
 * Sticky footer navigation bar with progress, back/next/submit,
 * and mobile action buttons (preview, guide, support).
 *
 * Props:
 *   currentStep, STEPS, FINAL_STEP,
 *   goBack, goNext, isUploading,
 *   watch, majorLoading, majorInfo,
 *   isInputFocused, isMobile,
 *   setIsPdfPreviewOpen, setIsGuideOpen,
 *   TELEGRAM_SUPPORT_URL
 */
export default function WizardNavigation({
  currentStep,
  STEPS,
  FINAL_STEP,
  goBack,
  goNext,
  isUploading,
  watch,
  majorLoading,
  majorInfo,
  isInputFocused,
  isMobile,
  setIsPdfPreviewOpen,
  setIsGuideOpen,
  TELEGRAM_SUPPORT_URL,
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[env(safe-area-inset-bottom)] lg:sticky lg:bottom-0 lg:z-10 lg:px-0 lg:pt-3 transition-transform duration-200 ${
        isInputFocused && isMobile ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm px-4 py-3">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.round(
                    ((currentStep + 1) / STEPS.length) * 100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Step indicator and percentage */}
          <div className="flex items-center justify-center gap-3 mb-3 text-sm font-medium text-base-content/70">
            <span>
              Schritt {currentStep + 1} / {STEPS.length}
            </span>
            <span className="text-primary font-semibold">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn"
              onClick={goBack}
              disabled={currentStep === 0 || isUploading}
            >
              Zurück
            </button>

            {currentStep === FINAL_STEP ? (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  !watch("agreePrivacy") ||
                  isUploading ||
                  majorLoading ||
                  !majorInfo.collectionName
                }
              >
                {isUploading ? (
                  "Hochladen..."
                ) : (
                  <>
                    <FaPaperPlane className="inline-block mr-2" />
                    Absenden
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={goNext}
                disabled={isUploading}
              >
                Weiter
              </button>
            )}
          </div>

          {/* Mobile actions */}
          <MobileActions
            setIsPdfPreviewOpen={setIsPdfPreviewOpen}
            setIsGuideOpen={setIsGuideOpen}
            TELEGRAM_SUPPORT_URL={TELEGRAM_SUPPORT_URL}
          />
        </div>
      </div>
    </div>
  );
}

/** Mobile-only action buttons (preview, guide, support). */
function MobileActions({
  setIsPdfPreviewOpen,
  setIsGuideOpen,
  TELEGRAM_SUPPORT_URL,
}) {
  return (
    <div className="mt-3 flex items-center justify-between lg:hidden">
      <button
        type="button"
        className="btn btn-primary btn-circle btn-sm shadow"
        aria-label="Vorschau öffnen"
        onClick={() => setIsPdfPreviewOpen(true)}
      >
        <FaFileAlt className="text-base" />
        <span className="sr-only">Vorschau</span>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-circle btn-sm shadow"
          aria-label="Video-Guide öffnen"
          onClick={() => setIsGuideOpen(true)}
        >
          <FaVideo className="text-base" />
          <span className="sr-only">Video-Guide</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-circle btn-sm shadow"
          aria-label="Support via Telegram"
          onClick={() =>
            window.open(
              TELEGRAM_SUPPORT_URL,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <FaTelegramPlane className="text-base" />
          <span className="sr-only">Support Chat</span>
        </button>
      </div>
    </div>
  );
}
