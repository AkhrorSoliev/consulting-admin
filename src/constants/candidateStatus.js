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
    label: "Stufe 1 (Internes Gespräch) – Ausstehend",
    badgeTone: "primary",
    emailBody:
      "Entscheidung für Stufe 1 (Internes Gespräch) wird gesendet (angenommen oder abgelehnt).",
  },
  {
    value: "stage_2",
    label: "Stufe 2 – Ergebnis des internen Gesprächs",
    badgeTone: "info",
    emailBody:
      "Ergebnis des internen Gesprächs wird gesendet: erfolgreich bestanden oder abgelehnt.",
  },
  {
    value: "stage_3",
    label: "Stufe 3 – Einladung zum Gespräch mit Arbeitgeber",
    badgeTone: "warning",
    emailBody:
      "Einladung zum Gespräch mit Arbeitgeber oder Entscheidung wird gesendet.",
  },
  {
    value: "stage_4",
    label: "Stufe 4 – Entscheidung des Arbeitgebers",
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
