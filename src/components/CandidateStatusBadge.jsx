import { getCandidateStatus } from "../constants/candidateStatus";

const toneClass = {
  info: "badge-info text-white",
  primary: "badge-primary text-white",
  warning: "badge-warning",
  success: "badge-success text-white",
};

function CandidateStatusBadge({ value, className = "", display = "full" }) {
  const status = getCandidateStatus(value);
  const tone = status.badgeTone || "info";
  const classes = `bg-base-300 badge min-w-0 max-w-full overflow-hidden ${className}`;

  const normalized = String(value || "").trim();
  const m = normalized.match(/^stage_(\d+)$/);
  const stageNumber = m ? m[1] : "";
  const displayLabel =
    display === "stage" && stageNumber
      ? `${stageNumber}-bosqich`
      : status.label;

  return (
    <span className={classes} title={status.label}>
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

export default CandidateStatusBadge;
