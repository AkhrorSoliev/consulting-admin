import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
} from "../constants/candidateStatus";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildFullName(firstName, lastName) {
  const parts = [String(firstName || "").trim(), String(lastName || "").trim()];
  const full = parts.filter(Boolean).join(" ").trim();
  return full || "hurmatli nomzod";
}

function formatInterviewDateTime(value) {
  if (!value) return "";
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);

    const formatter = new Intl.DateTimeFormat("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tashkent",
    });

    const parts = formatter.formatToParts(parsed).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    if (parts.year && parts.month && parts.day && parts.hour && parts.minute) {
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} (Toshkent vaqti)`;
    }

    return formatter.format(parsed);
  } catch {
    return String(value);
  }
}

function buildInterviewDetailsBlock(interviewDetails) {
  if (!interviewDetails || typeof interviewDetails !== "object") return "";
  const { dateTime, location, items } = interviewDetails;
  const lines = [];
  if (dateTime) lines.push(`• Sana/vaqt: ${formatInterviewDateTime(dateTime)}`);
  if (location) lines.push(`• Manzil: ${location}`);
  if (items) lines.push(`• Olib kelish shart: ${items}`);
  if (lines.length === 0) return "";
  return ["Suhbat tafsilotlari:", ...lines].join("\n");
}

function buildDecisionCopy(decisionRaw) {
  const decision = decisionRaw === "rejected" ? "rejected" : "accepted";

  if (decision === "accepted") {
    return {
      decision,
      title: "qabul qilindingiz",
      mainText:
        "Tabriklaymiz! Siz ish beruvchi bilan suhbatdan muvaffaqiyatli o'tdingiz va ish taklifini olish jarayoniga o'tdingiz.",
      nextStepNote:
        "Hujjatlarni tayyorlashni boshlash uchun iltimos Telegram'da bizga yozing: @consultinguz_chat (https://t.me/consultinguz_chat). Jamoamiz keyingi qadamlarni tushuntirib beradi.",
      decisionInfo:
        "Qabul qilindingiz — hujjatlarni tayyorlash va ishga chiqish jarayoni boshlanadi.",
    };
  }

  return {
    decision,
    title: "rad etildi",
    mainText:
      "Arizangiz diqqat bilan ko'rib chiqildi. Tanlov jarayonining joriy bosqichida ushbu lavozim bo'yicha jarayonni boshqa yo'nalishda davom ettirishga qaror qilindi.",
    nextStepNote:
      "Iltimos, buni shaxsiy yoki kasbiy baho sifatida qabul qilmang. Tajribangiz va ko'nikmalaringiz biz uchun qadrli. Kelgusida mos vakansiyalar paydo bo'lganda sizni xabardor qilamiz.",
    decisionInfo:
      "Mazkur vakansiya bo'yicha tanlov jarayonining ushbu bosqichi yakunlandi.",
  };
}

export function buildStatusEmailTemplate({
  statusValue,
  firstName,
  lastName,
  interviewDetails,
  employerDecision,
  decisionNote,
}) {
  const status = getCandidateStatus(statusValue || CANDIDATE_STATUS_DEFAULT);
  const fullName = buildFullName(firstName, lastName);

  const greeting = `Hurmatli ${fullName},`;
  const isEmployerInterview = statusValue === "employer_interview_scheduled";
  const isEmployerDecision = statusValue === "employer_decision";
  const decisionCopy = isEmployerDecision
    ? buildDecisionCopy(employerDecision)
    : null;

  const detailBlock = isEmployerInterview
    ? buildInterviewDetailsBlock(interviewDetails)
    : "";

  const statusLabelText = isEmployerDecision
    ? `Ish beruvchining qarori — ${decisionCopy.title}`
    : status.label;

  const mainText = isEmployerDecision
    ? decisionCopy.mainText
    : isEmployerInterview
    ? "Ish beruvchi bilan suhbat belgilandi. Quyidagi tafsilotlarni ko'rib chiqing."
    : status.emailBody;

  const nextStepNote = isEmployerDecision
    ? decisionCopy.nextStepNote
    : isEmployerInterview
    ? "Suhbat sanasini kalendaringizga qo'shishni va zarur hujjatlarni tayyorlab qo'yishingizni tavsiya etamiz."
    : "Jarayon davomida qo'shimcha ma'lumot kerak bo'lsa, siz bilan bevosita bog'lanamiz.";

  const supportLine =
    "Savol yoki takliflaringiz bo'lsa, Telegram'da @consultinguz_chat (https://t.me/consultinguz_chat) orqali yozing — javob beramiz.";

  const closing = "Hurmat bilan,\nConsultinguz jamoasi";

  const parts = [
    greeting,
    "",
    "Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing.",
    `Holat: ${statusLabelText}`,
    mainText,
    nextStepNote,
  ];

  if (isEmployerDecision && decisionCopy.decisionInfo) {
    parts.push(`Qaror tafsiloti: ${decisionCopy.decisionInfo}`);
  }

  if (decisionNote) {
    parts.push(`Qo'shimcha izoh: ${decisionNote}`);
  }

  if (detailBlock) {
    parts.push("", detailBlock);
  }

  parts.push("", supportLine, "", closing);

  const message = parts.join("\n");

  const htmlContent = buildHtmlEmail({
    fullName,
    statusLabel: statusLabelText,
    mainText,
    nextStepNote,
    interviewDetails: isEmployerInterview ? interviewDetails : null,
    decisionInfo: isEmployerDecision ? decisionCopy.decisionInfo : "",
    decisionNote: decisionNote || "",
  });

  const subjectPrefix = isEmployerDecision
    ? "Ish beruvchining qarori"
    : "Arizangiz holati yangilandi";

  return {
    subject: `${subjectPrefix}: ${statusLabelText}`,
    message,
    htmlContent,
    statusLabel: statusLabelText,
  };
}

function buildHtmlEmail({
  fullName,
  statusLabel,
  mainText,
  nextStepNote,
  interviewDetails,
  decisionInfo,
  decisionNote,
}) {
  const detailRows = buildDetailRows({
    interviewDetails,
    decisionInfo,
    decisionNote,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Ariza holati yangilandi</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
          <tr>
            <td style="text-align:center; padding-bottom:16px;">
              <h2 style="margin:0; color:#2c3e50; font-size:22px;">Ariza holati yangilandi</h2>
              <div style="margin-top:8px; color:#5f6b7a; font-size:14px;">Holat: <strong>${escapeHtml(
                statusLabel
              )}</strong></div>
            </td>
          </tr>
          <tr>
            <td style="color:#333; font-size:15px; line-height:1.6;">
              <p style="margin:0 0 12px 0;">Hurmatli <b>${escapeHtml(
                fullName
              )}</b>,</p>
              <p style="margin:0 0 12px 0;">Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:</p>
              <p style="margin:0 0 14px 0; color:#1f2d3d;"><strong>${escapeHtml(
                mainText
              )}</strong></p>
              <p style="margin:0 0 14px 0;">${escapeHtml(nextStepNote)}</p>
              ${detailRows}
              ${
                decisionNote
                  ? `<p style="margin:10px 0 0 0; color:#3a4a5e;">Qo'shimcha izoh: ${escapeHtml(
                      decisionNote
                    )}</p>`
                  : ""
              }
              <p style="margin:18px 0 0 0;">Savol yoki takliflaringiz bo'lsa, Telegram'da <a href="https://t.me/consultinguz_chat" style="color:#1e7dd1; text-decoration:none;">@consultinguz_chat</a> orqali yozing — javob beramiz.</p>
              <p style="margin:8px 0 0 0;">Hurmat bilan,<br/><b>ConsultingUZ jamoasi</b></p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:22px; text-align:center; font-size:12px; color:#888;">
              © 2025 ConsultingUZ
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function buildDetailRows({ interviewDetails, decisionInfo, decisionNote }) {
  const rows = [];

  if (decisionInfo) {
    rows.push({ label: "✅ Qaror", value: decisionInfo });
  }
  if (decisionNote) {
    rows.push({ label: "📝 Qo'shimcha izoh", value: decisionNote });
  }

  if (interviewDetails && typeof interviewDetails === "object") {
    if (interviewDetails.dateTime) {
      rows.push({
        label: "📅 Sana / Vaqt",
        value: formatInterviewDateTime(interviewDetails.dateTime),
      });
    }
    if (interviewDetails.location) {
      rows.push({ label: "📍 Manzil", value: interviewDetails.location });
    }
    if (interviewDetails.items) {
      rows.push({
        label: "📄 Olib kelish shart",
        value: interviewDetails.items,
      });
    }
  }

  if (rows.length === 0) return "";

  const items = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 8px; width:180px; color:#1f2d3d;"><b>${escapeHtml(
            row.label
          )}:</b></td>
          <td style="padding:6px 8px; color:#3a4a5e;">${escapeHtml(
            row.value
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <table width="100%" style="background:#f8f9fb; border-radius:8px; padding:12px 10px; margin:10px 0 14px 0; border:1px solid #eef1f4;">
      ${items}
    </table>
  `;
}
