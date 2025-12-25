import { CANDIDATE_STATUS_OPTIONS, CANDIDATE_STATUS_DEFAULT } from "../constants/candidateStatus";
import CandidateStatusBadge from "./CandidateStatusBadge";

function CandidateStatusStepper({
  currentValue = CANDIDATE_STATUS_DEFAULT,
  onSendEmail,
  sendingValue = null,
  disabled = false,
}) {
  const steps = CANDIDATE_STATUS_OPTIONS;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.value === currentValue)
  );

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body space-y-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Kandidatenstufen</h3>
          <p className="text-sm opacity-70">
            Senden Sie für jede Stufe eine E-Mail. Beim Senden wählen Sie
            „Annehmen/Ablehnen“. Bei Annahme wird die nächste Stufe freigeschaltet.
          </p>
        </div>

        <div className="steps steps-vertical lg:steps-horizontal w-full">
          {steps.map((step, idx) => {
            const isCurrent = step.value === currentValue;
            const isCompleted = idx < currentIndex;
            const isSending = sendingValue === step.value;
            const stateClass = isCompleted || isCurrent ? "step-primary" : "";
            return (
              <div key={step.value} className={`step ${stateClass}`}>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="font-semibold text-sm">
                    {idx + 1}. {step.label}
                  </div>
                  <CandidateStatusBadge value={step.value} />
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onSendEmail?.(step.value)}
                    disabled={disabled || !isCurrent || isSending}
                  >
                    {isSending ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : null}
                    E-Mail senden
                  </button>
                  {!isCurrent && (
                    <p className="text-xs opacity-60">
                      Wird nach Abschluss der vorherigen Stufe verfügbar.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CandidateStatusStepper;

