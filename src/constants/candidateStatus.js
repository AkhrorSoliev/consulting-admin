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
    label: "1-bosqich - Ichki suhbat - Kutilmoqda",
    badgeTone: "primary",
    emailBody:
      "1-bosqich (ichki suhbat) uchun qaror yuboriladi (qabul qilindi yoki rad etildi).",
  },
  {
    value: "stage_2",
    label: "2-bosqich - Ichki suhbat natijasi",
    badgeTone: "info",
    emailBody:
      "Ichki suhbat natijasi yuboriladi: muvaffaqiyatli o'tdi yoki rad etildi.",
  },
  {
    value: "stage_2_result",
    label: "2-bosqich - Rahbariyat bilan suhbat natijasi",
    badgeTone: "info",
    emailBody:
      "Rahbariyat bilan suhbat natijasi yuboriladi: muvaffaqiyatli o'tdi yoki rad etildi.",
  },
  {
    value: "stage_3",
    label: "3-bosqich - Ish beruvchi bilan suhbatga taklif",
    badgeTone: "warning",
    emailBody: "Ish beruvchi bilan suhbatga taklif yoki qaror yuboriladi.",
  },
  {
    value: "stage_4",
    label: "4-bosqich - Ish beruvchining qarori",
    badgeTone: "success",
    emailBody:
      "Ish beruvchining qarori yuboriladi: rad etildi yoki qabul qilindi.",
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
