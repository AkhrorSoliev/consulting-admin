export const CANDIDATE_STATUS_DEFAULT = "received";

export const CANDIDATE_STATUS_OPTIONS = [
  {
    value: "received",
    label: "Ma'lumotlaringiz qabul qilindi",
    badgeTone: "info",
    emailBody:
      "Arizangizni qabul qildik va ko'rib chiqishni boshladik. Qo'shimcha ma'lumot kerak bo'lsa, siz bilan aloqaga chiqamiz.",
  },
  {
    value: "internal_interview_passed",
    label: "Ichki suhbatdan o'tdingiz",
    badgeTone: "primary",
    emailBody:
      "Ichki suhbatdan muvaffaqiyatli o'tdingiz. Keyingi bosqichlarga tayyorlanishingizni so'raymiz.",
  },
  {
    value: "employer_interview_scheduled",
    label: "Ish beruvchi bilan suhbat belgilanadi",
    badgeTone: "warning",
    emailBody:
      "Ish beruvchi bilan suhbat belgilanmoqda. Aniq sana va vaqt bilan tez orada siz bilan bog'lanamiz.",
  },
  {
    value: "employer_decision",
    label: "Ish beruvchining qarori (qabul/ rad)",
    badgeTone: "success",
    emailBody:
      "Ish beruvchi bilan suhbat yakunlandi. Qaror (qabul qilindi yoki rad etildi) haqida alohida xabarnoma jo'natiladi.",
  },
];

export const candidateStatusMap = Object.fromEntries(
  CANDIDATE_STATUS_OPTIONS.map((item) => [item.value, item])
);

export function getCandidateStatus(value) {
  return (
    candidateStatusMap[value] || candidateStatusMap[CANDIDATE_STATUS_DEFAULT]
  );
}
