export const CANDIDATE_STATUS_DEFAULT = "stage_1";

const LEGACY_STATUS_MAP = {
  received: "stage_1",
  internal_interview_passed: "stage_2",
  employer_interview_scheduled: "stage_3",
  employer_decision: "stage_4",
};

export function normalizeCandidateStatusValue(value) {
  const raw = String(value || "").trim();
  return LEGACY_STATUS_MAP[raw] || raw;
}

export const CANDIDATE_STATUS_OPTIONS = [
  {
    value: "stage_1",
    label: "Stufe 1 (internes Gespräch) – ausstehend",
    badgeTone: "primary",
    emailBody:
      "Entscheidung zur Stufe 1 (internes Gespräch) wird gesendet (angenommen oder abgelehnt).",
  },
  {
    value: "stage_2",
    label: "Stufe 2 – Ergebnis internes Gespräch",
    badgeTone: "info",
    emailBody:
      "Ergebnis des internen Gesprächs wird gesendet: bestanden oder abgelehnt.",
  },
  {
    value: "stage_3",
    label: "Stufe 3 – Einladung Arbeitgebergespräch",
    badgeTone: "warning",
    emailBody:
      "Einladung zum Arbeitgebergespräch oder Entscheidung wird gesendet.",
  },
  {
    value: "stage_4",
    label: "Stufe 4 – Entscheidung Arbeitgeber",
    badgeTone: "success",
    emailBody:
      "Entscheidung des Arbeitgebers wird gesendet: abgelehnt oder angenommen.",
  },
];

export const candidateStatusMap = Object.fromEntries(
  CANDIDATE_STATUS_OPTIONS.map((item) => [item.value, item])
);

export function getCandidateStatus(value) {
  const normalized = normalizeCandidateStatusValue(value);
  return (
    candidateStatusMap[normalized] ||
    candidateStatusMap[CANDIDATE_STATUS_DEFAULT]
  );
}
