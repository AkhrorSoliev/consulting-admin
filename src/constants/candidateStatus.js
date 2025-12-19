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
    label: "1-bosqich kutilmoqda",
    badgeTone: "primary",
    emailBody:
      "1-bosqich (ichki suhbat) bo'yicha qaror yuboriladi (qabul yoki rad).",
  },
  {
    value: "stage_2",
    label: "1-bosqich yakunlandi",
    badgeTone: "info",
    emailBody:
      "Ichki suhbat natijasi yuboriladi: ichki suhbatdan o'tdi yoki rad etildi.",
  },
  {
    value: "stage_3",
    label: "Ish beruvchi bilan suhbatga taklif",
    badgeTone: "warning",
    emailBody:
      "Ish beruvchi bilan suhbatga taklif yoki qaror yuboriladi.",
  },
  {
    value: "stage_4",
    label: "Ish beruvchi qarori",
    badgeTone: "success",
    emailBody:
      "Ish beruvchi rad qildi yoki qabul qildi degan qaror yuboriladi.",
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
