import { FaEnvelope, FaSave } from "react-icons/fa";
import CandidateStatusBadge from "./CandidateStatusBadge";
import { CANDIDATE_STATUS_OPTIONS } from "../constants/candidateStatus";

function formatDate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("de-DE");
  } catch {
    return "";
  }
}

function CandidateStatusPanel({
  value,
  onChange,
  onSave,
  onSendEmail,
  saving = false,
  sending = false,
  disabled = false,
  candidateEmail = "",
  candidateName = "",
  lastUpdated,
  updatedBy = "",
}) {
  const infoLines = [];
  if (lastUpdated) infoLines.push(`Aktualisiert: ${formatDate(lastUpdated)}`);
  if (updatedBy) infoLines.push(`Von: ${updatedBy}`);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
      <div className="card-body gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
              Kandidatenstatus
            </p>
            <p className="text-xs opacity-70">
              Super-Admin und Admin können den Status aktualisieren und E-Mails
              senden.
            </p>
          </div>
          <CandidateStatusBadge value={value} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="form-control">
            <label className="label" htmlFor="candidate-status-select">
              <span className="label-text font-medium">Stufe auswählen</span>
            </label>
            <select
              id="candidate-status-select"
              className="select select-bordered w-full"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled || saving || sending}
            >
              {CANDIDATE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {infoLines.length > 0 && (
              <p className="text-xs opacity-60 mt-2">{infoLines.join(" • ")}</p>
            )}
            {candidateEmail && (
              <p className="text-xs opacity-80 mt-1">
                Empfänger: {candidateEmail}
                {candidateName ? ` — ${candidateName}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <button
              className="btn btn-primary w-full md:w-auto"
              onClick={onSave}
              disabled={disabled || saving || sending}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <FaSave />
              )}
              <span>Status speichern</span>
            </button>
            <button
              className="btn btn-outline btn-secondary w-full md:w-auto"
              onClick={onSendEmail}
              disabled={disabled || saving || sending || !candidateEmail}
            >
              {sending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <FaEnvelope />
              )}
              <span>Status-E-Mail senden</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateStatusPanel;
