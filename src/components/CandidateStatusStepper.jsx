import {
  CANDIDATE_STATUS_OPTIONS,
  CANDIDATE_STATUS_DEFAULT,
} from "../constants/candidateStatus";
import CandidateStatusBadge from "./CandidateStatusBadge";
import { FaUndo, FaEnvelope } from "react-icons/fa";

function CandidateStatusStepper({
  currentValue = CANDIDATE_STATUS_DEFAULT,
  onSendEmail,
  sendingValue = null,
  disabled = false,
  resetStages,
  openCustomEmailModal,
}) {
  const steps = CANDIDATE_STATUS_OPTIONS;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.value === currentValue)
  );

  return (
    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body p-4 sm:p-6">
        <div className="flex flex-col gap-1 sm:gap-2 mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold">Kandidatenstufen</h3>
          <p className="text-xs sm:text-sm text-base-content/70">
            Senden Sie für jede Stufe eine E-Mail. Beim Senden wählen Sie
            „Annehmen/Ablehnen". Bei Annahme wird die nächste Stufe
            freigeschaltet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((step, idx) => {
            const isCurrent = step.value === currentValue;
            const isCompleted = idx < currentIndex;
            const isSending = sendingValue === step.value;
            const borderClass = isCurrent
              ? "border-primary bg-primary/5 shadow-lg"
              : isCompleted
              ? "border-success bg-success/5"
              : "border-base-300 bg-base-100 opacity-60";
            const badgeClass = isCurrent
              ? "bg-primary text-primary-content"
              : isCompleted
              ? "bg-success text-success-content"
              : "bg-base-300 text-base-content";
            const btnClass = isCurrent ? "btn-primary" : "btn-outline";
            return (
              <div
                key={step.value}
                className={`relative rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 ${borderClass}`}
              >
                <div
                  className={`absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${badgeClass}`}
                >
                  {idx + 1}
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 mt-1 sm:mt-2">
                  <div className="flex justify-center">
                    <CandidateStatusBadge value={step.value} />
                  </div>

                  <button
                    className={`btn btn-xs sm:btn-sm w-full ${btnClass}`}
                    onClick={() => onSendEmail?.(step.value)}
                    disabled={disabled || !isCurrent || isSending}
                  >
                    {isSending ? (
                      <span className="loading loading-spinner loading-xs sm:loading-sm" />
                    ) : (
                      <FaEnvelope className="text-xs sm:text-sm" />
                    )}
                    <span className="text-xs sm:text-sm ml-1">E-Mail</span>
                  </button>

                  {isCompleted && (
                    <div className="text-[10px] sm:text-xs text-success text-center font-medium">
                      ✓ Abgeschlossen
                    </div>
                  )}

                  {!isCurrent && !isCompleted && (
                    <div className="text-[10px] sm:text-xs text-base-content/60 text-center">
                      Noch nicht verfügbar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="divider my-3 sm:my-4"></div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-outline btn-secondary"
            onClick={resetStages}
            disabled={Boolean(sendingValue)}
            title="Kandidatenstufen auf Anfang (Stufe 1) zurücksetzen und E-Mail-Zähler auf 0 setzen"
          >
            <FaUndo className="text-xs sm:text-sm" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">
              Stufen zurücksetzen
            </span>
            <span className="sm:hidden text-xs ml-1">Zurücksetzen</span>
          </button>
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-outline"
            onClick={openCustomEmailModal}
            disabled={Boolean(sendingValue)}
          >
            <FaEnvelope className="text-xs sm:text-sm" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">
              Benutzerdefinierte E-Mail
            </span>
            <span className="sm:hidden text-xs ml-1">Custom E-Mail</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateStatusStepper;
