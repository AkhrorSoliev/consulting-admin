import { getCandidateStatus } from "../constants/candidateStatus";

const toneClass = {
  info: "badge-info text-white",
  primary: "badge-primary text-white",
  warning: "badge-warning",
  success: "badge-success text-white",
};

function CandidateStatusBadge({ value, className = "" }) {
  const status = getCandidateStatus(value);
  const tone = status.badgeTone || "info";
  const classes = `${toneClass[tone] || toneClass.info} badge ${className}`;

  return <span className={classes}>{status.label}</span>;
}

export default CandidateStatusBadge;
