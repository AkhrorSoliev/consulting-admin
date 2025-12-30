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

function buildKeyValueBlock(title, rows) {
  const safeRows = Array.isArray(rows) ? rows.filter((r) => r && r.value) : [];
  if (safeRows.length === 0) return "";
  const lines = safeRows.map((r) => `• ${r.label}: ${r.value}`);
  return [title, ...lines].join("\n");
}

function normalizeDecision(decisionRaw) {
  return decisionRaw === "rejected" ? "rejected" : "accepted";
}

function pickStageCopy(stage, decision) {
  const d = normalizeDecision(decision);

  const telegramChannelsText = [
    "Qo'shimcha ma'lumotlar uchun Telegram kanallarimiz:",
    "🔹 ConsultingUz rasmiy kanali: https://t.me/Consulting_UZB",
    "🔹 O‘zbekiston bo‘ylab nemis tili markazlarimiz: https://t.me/dafsprachzentrum",
  ].join("\n");

  const commonClosing = {
    channelsText: telegramChannelsText,
    closing: "Hurmat bilan,\nConsultingUZ jamoasi",
  };

  if (stage === "stage_1") {
    if (d === "accepted") {
      return {
        subject: "1-bosqich: Ichki suhbatga taklif",
        title: "Ichki suhbatga taklif",
        mainText:
          "Sizning arizangiz ko‘rib chiqildi va Siz 1-bosqich suhbatiga taklif etilganingizni mamnuniyat bilan ma’lum qilamiz.",
        nextStepNote:
          "1-bosqich suhbatida ishtirok etish uchun iltimos, quyidagi Google Meet havolasi orqali uchrashuvga qo‘shiling va belgilangan vaqtda ishtirok etishingizni tasdiqlang.",
        ...commonClosing,
      };
    }
    return {
      subject: "1-bosqich: Rad javobi",
      title: "Arizangiz ko‘rib chiqildi",
      mainText:
        "Sizning arizangiz ko‘rib chiqildi. Afsuski, hujjatlaringiz ushbu bo‘sh ish o‘rni talablariga mos kelmadi.",
      nextStepNote:
        "Sizga boshqa mavjud bo‘sh ish o‘rinlarimizga hujjat topshirib, yana urinib ko‘rishingizni tavsiya qilamiz. Qiziqishingiz va vaqtingiz uchun minnatdorchilik bildiramiz.",
      ...commonClosing,
    };
  }

  if (stage === "stage_2") {
    if (d === "accepted") {
      return {
        subject: "2-bosqich: Ariza holati yangilandi",
        title: "Ichki suhbatdan muvaffaqiyatli o'tdingiz",
        mainText:
          "Siz ichki suhbatdan muvaffaqiyatli o‘tdingiz. Keyingi bosqichlarga tayyorgarlik ko‘rishingizni so‘raymiz.",
        nextStepNote:
          "Keyingi jarayonlar bo'yicha zarur ma'lumotlar Sizga qo'shimcha ravishda taqdim etiladi. Jarayon davomida qo'shimcha ma'lumot zarur bo'lsa, Siz bilan bevosita bog'lanamiz.",
        examples: [
          {
            id: "example1",
            title: "1-misol: Standart tabrik",
            content:
              "Sizning bilim va tajribangiz yuqori baholandi. Ichki suhbatdan muvaffaqiyatli o‘tganingiz bilan tabriklaymiz.",
          },
          {
            id: "example2",
            title: "2-misol: Yuqori rahbariyat bilan suhbat",
            content: `Siz ConsultingUz rahbari Orif Akhmadaliyev bilan ikkinchi bosqich ichki suhbatga taklif qilinasiz.

Suhbatga oid barcha zarur ma’lumotlar (sana, vaqt va Google Meet havolasi) quyida keltirilgan. Iltimos, ko‘rsatilgan Google Meet havolasi orqali qo‘shiling.

Keyingi bosqichlar bo‘yicha batafsil ma’lumotlar Sizga qo‘shimcha tarzda taqdim etiladi. Jarayon davomida qo‘shimcha ma’lumot zarur bo‘lsa, Siz bilan bevosita bog‘lanamiz.`,
          },
        ],
        ...commonClosing,
      };
    }
    return {
      subject: "2-bosqich: Rad javobi",
      title: "Ariza holati yangilandi",
      mainText:
        "Afsuski, tanlov jarayonining ushbu bosqichida Sizning nomzodingiz keyingi bosqichga o‘tkazilmadi.",
      nextStepNote:
        "Qaror tanlov mezonlari asosida qabul qilindi. Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun minnatdorchilik bildiramiz hamda kelgusida yana urinib ko‘rishingizni tavsiya qilamiz.",
      ...commonClosing,
    };
  }

  if (stage === "stage_3") {
    if (d === "accepted") {
      return {
        subject: "3-bosqich: Ish beruvchi bilan suhbat",
        title: "Ish beruvchi bilan suhbatga taklif",
        mainText:
          "Siz tanlov jarayonining keyingi bosqichiga o‘tdingiz. Ish beruvchi bilan suhbatga taklif etilasiz.",
        nextStepNote:
          "Suhbat tafsilotlarini diqqat bilan ko‘rib chiqing va belgilangan vaqtda ishtirok etishingizni tasdiqlang.",
        ...commonClosing,
      };
    }
    return {
      subject: "3-bosqich: Rad javobi",
      title: "Ariza holati yangilandi",
      mainText:
        "Afsuski, tanlov jarayonining ushbu bosqichida Sizning nomzodingiz keyingi bosqichga o‘tkazilmadi.",
      nextStepNote:
        "Qiziqishingiz va vaqtingiz uchun minnatdorchilik bildiramiz. Kelgusida boshqa mos bo‘sh ish o‘rinlarimizga hujjat topshirib, yana urinib ko‘rishingizni tavsiya qilamiz.",
      ...commonClosing,
    };
  }

  // stage_4
  if (d === "accepted") {
    return {
      subject: "4-bosqich: Hujjatlarni yuklash",
      title: "Hujjatlarni yuklash",
      mainText:
        "Siz ish beruvchi bilan o‘tkazilgan suhbatdan muvaffaqiyatli o‘tdingiz. Iltimos, quyidagi havola orqali tizimga kirib, talab etilgan hujjatlarni yuklang.",
      nextStepNote:
        "Shuningdek, imzolanishi lozim bo‘lgan hujjatlarni yuklab olib, ularni imzolaganingizdan so‘ng, yana ushbu havola orqali qayta yuklashingizni so‘raymiz.",
      ...commonClosing,
    };
  }
  return {
    subject: "4-bosqich: Rad javobi",
    title: "Ariza holati yangilandi",
    mainText:
      "Afsuski, tanlov jarayonining yakuniy bosqichida Sizning nomzodingiz bo‘yicha ijobiy qaror qabul qilinmadi.",
    nextStepNote:
      "Qiziqishingiz va vaqtingiz uchun minnatdorchilik bildiramiz. Kelgusida mos bo‘sh ish o‘rinlarimiz paydo bo‘lsa, Sizni xabardor qilishimiz mumkin.",
    ...commonClosing,
  };
}

export function getStatusEmailCopy(stage, decision) {
  const normalizedStage =
    String(stage || "").trim() || CANDIDATE_STATUS_DEFAULT;
  return pickStageCopy(normalizedStage, decision);
}

function applyCopyOverrides(copy, overrides) {
  const base = copy && typeof copy === "object" ? copy : {};
  const o = overrides && typeof overrides === "object" ? overrides : {};
  return {
    ...base,
    emailTitle:
      o.emailTitle !== undefined ? String(o.emailTitle || "") : base.emailTitle,
    statusLabel:
      o.statusLabel !== undefined
        ? String(o.statusLabel || "")
        : base.statusLabel,
    subject: o.subject !== undefined ? String(o.subject || "") : base.subject,
    mainText:
      o.mainText !== undefined ? String(o.mainText || "") : base.mainText,
    nextStepNote:
      o.nextStepNote !== undefined
        ? String(o.nextStepNote || "")
        : base.nextStepNote,
    channelsText:
      o.channelsText !== undefined
        ? String(o.channelsText || "")
        : base.channelsText,
    emphasizeMainText:
      o.emphasizeMainText !== undefined
        ? Boolean(o.emphasizeMainText)
        : base.emphasizeMainText,
  };
}

export function buildStatusEmailTemplate({
  statusValue,
  firstName,
  lastName,
  stageDecision,
  decisionNote,
  additionalInfo,
  copyOverrides,
}) {
  const normalizedStatusValue = statusValue || CANDIDATE_STATUS_DEFAULT;
  const status = getCandidateStatus(normalizedStatusValue);
  const fullName = buildFullName(firstName, lastName);

  const decision = normalizeDecision(stageDecision);
  const copy = applyCopyOverrides(
    pickStageCopy(normalizedStatusValue, decision),
    copyOverrides
  );

  const statusLabelText = String(
    copy.statusLabel !== undefined && String(copy.statusLabel || "").trim()
      ? copy.statusLabel
      : status.label
  ).trim();
  const emailTitle = String(
    copy.emailTitle || "Ariza holati yangilandi"
  ).trim();
  const mainText = String(copy.mainText || "").trim();
  const nextStepNote = String(copy.nextStepNote || "").trim();

  const dateTime = String(additionalInfo?.dateTime || "").trim();
  const link = String(additionalInfo?.link || "").trim();
  const locationName = String(additionalInfo?.locationName || "").trim();
  const locationUrl = String(additionalInfo?.locationUrl || "").trim();
  const hasLocation = Boolean(locationName || locationUrl);

  const extraRows = [
    dateTime
      ? { label: "Sana / vaqt", value: formatInterviewDateTime(dateTime) }
      : null,
    link ? { label: "Havola", value: link } : null,
    hasLocation
      ? {
          label: "Lokatsiya",
          value: [locationName || "", locationUrl || ""]
            .filter(Boolean)
            .join(locationName && locationUrl ? " — " : ""),
        }
      : null,
  ].filter(Boolean);

  const detailBlock = buildKeyValueBlock("Qo'shimcha ma'lumotlar:", extraRows);

  const channelsBlock = copy.channelsText ? `\n${copy.channelsText}\n` : "";

  const parts = [
    `Hurmatli ${fullName},`,
    "",
    "Arizangiz holati yangilandi. Quyidagi sharh va keyingi qadamlar bilan diqqat bilan tanishib chiqing.",
    `Holat: ${statusLabelText}`,
    mainText,
    "",
    nextStepNote,
  ];

  if (decisionNote) {
    parts.push(`Qo'shimcha izoh: ${decisionNote}`);
  }

  if (detailBlock) {
    parts.push("", detailBlock);
  }

  if (channelsBlock) {
    parts.push(channelsBlock.trimEnd());
  }
  parts.push("", copy.closing);

  const message = parts.join("\n");

  const htmlContent = buildHtmlEmail({
    fullName,
    statusLabel: statusLabelText,
    emailTitle,
    mainText,
    nextStepNote,
    additionalInfo:
      dateTime || link || locationName || locationUrl
        ? {
            dateTime: dateTime || "",
            link: link || "",
            locationName: locationName || "",
            locationUrl: locationUrl || "",
          }
        : null,
    decisionNote: decisionNote || "",
    channelsHtml: copy.channelsText || "",
    emphasizeMainText: Boolean(copy.emphasizeMainText),
  });

  return {
    subject: copy.subject || `Arizangiz holati: ${statusLabelText}`,
    message,
    htmlContent,
    statusLabel: statusLabelText,
    examples: copy.examples || null,
  };
}

function buildHtmlEmail({
  fullName,
  statusLabel,
  emailTitle,
  mainText,
  nextStepNote,
  decisionNote,
  additionalInfo,
  channelsHtml,
  emphasizeMainText,
}) {
  const detailRows = buildDetailRows({
    additionalInfo,
    decisionNote,
    channelsText: channelsHtml,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${escapeHtml(emailTitle || "Ariza holati yangilandi")}</title>
  <style type="text/css">
    body,table,td,a{ -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img{ -ms-interpolation-mode:bicubic; }
    body{ margin:0; padding:0; background-color:#f4f6f8; }
    .wrapper{ width:100%; table-layout:fixed; background-color:#f4f6f8; }
    .outer{ margin:0 auto; width:100%; max-width:600px; }
    .content{ background:#ffffff; border-radius:10px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.04); }
    p, td, div, span{ font-family:Arial, sans-serif; }
    .status{ color:#5f6b7a; font-size:14px; }
    .wrap-break-word{ word-break:break-word; overflow-wrap:anywhere; }
    .detail-table td{ vertical-align:top; }
    @media screen and (max-width:600px){
      .content{ padding:16px !important; }
      h2{ font-size:18px !important; }
      .status{ font-size:13px !important; }
      .detail-table td{ display:block; width:100% !important; padding:6px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial,sans-serif;">
  <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="outer" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td class="content">
              <div style="text-align:center; padding-bottom:16px;">
                <h2 style="margin:0; color:#2c3e50; font-size:22px;">${escapeHtml(
                  emailTitle || "Ariza holati yangilandi"
                )}</h2>
                <div class="status" style="margin-top:8px;">Holat: <strong>${escapeHtml(
                  statusLabel
                )}</strong></div>
              </div>
              <div style="color:#333; font-size:15px; line-height:1.6;">
                <p class="wrap-break-word" style="margin:0 0 12px 0;">Hurmatli <b>${escapeHtml(
                  fullName
                )}</b>,</p>
                <p class="wrap-break-word" style="margin:0 0 12px 0;">Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:</p>
                <p class="wrap-break-word" style="margin:0 0 14px 0; color:#1f2d3d; white-space:pre-wrap;">${
                  emphasizeMainText
                    ? `<strong>${escapeHtml(mainText)}</strong>`
                    : `${escapeHtml(mainText)}`
                }</p>
                <p class="wrap-break-word" style="margin:0 0 14px 0; white-space:pre-wrap;">${escapeHtml(
                  nextStepNote
                )}</p>
                ${detailRows}
                ${
                  decisionNote
                    ? `<p class="wrap-break-word" style="margin:10px 0 0 0; color:#3a4a5e;">Qo'shimcha izoh: ${escapeHtml(
                        decisionNote
                      )}</p>`
                    : ""
                }
                <p style="margin:8px 0 0 0;">Hurmat bilan,<br/><b>ConsultingUZ jamoasi</b></p>
              </div>
              <div style="padding-top:22px; text-align:center; font-size:12px; color:#888;">
                © 2025 ConsultingUZ
              </div>
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

function buildChannelsHtml(channelsText) {
  const raw = String(channelsText || "").trim();
  if (!raw) return "";
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  const items = lines
    .map((line) => {
      const m = line.match(/(https?:\/\/\S+)/);
      if (!m) return `<li>${escapeHtml(line)}</li>`;
      const url = m[1];
      const before = line.slice(0, line.indexOf(url)).trim();
      const after = line.slice(line.indexOf(url) + url.length).trim();
      const label = [before, after].filter(Boolean).join(" ").trim() || url;
      return `<li>${escapeHtml(label)}: <a href="${escapeHtml(
        url
      )}" style="color:#1e7dd1; text-decoration:none;">${escapeHtml(
        url
      )}</a></li>`;
    })
    .join("");

  return `
    <div style="margin:14px 0 0 0; padding:12px 12px; background:#f8f9fb; border-radius:8px; border:1px solid #eef1f4;">
      <div style="font-weight:bold; color:#1f2d3d; margin-bottom:6px;">Qo'shimcha ma'lumotlar</div>
      <ul style="margin:0; padding-left:18px; color:#3a4a5e; font-size:13px; line-height:1.5;">
        ${items}
      </ul>
    </div>
  `;
}

function buildDetailRows({ additionalInfo, decisionNote, channelsText }) {
  const rows = [];

  if (additionalInfo && typeof additionalInfo === "object") {
    const dt = String(additionalInfo.dateTime || "").trim();
    const link = String(additionalInfo.link || "").trim();
    const locName = String(additionalInfo.locationName || "").trim();
    const locUrl = String(additionalInfo.locationUrl || "").trim();
    if (dt) {
      rows.push({
        label: "📅 Sana / Vaqt",
        value: formatInterviewDateTime(dt),
      });
    }
    if (link) {
      rows.push({
        label: "🔗 Havola",
        value: link,
      });
    }
    if (locName || locUrl) {
      rows.push({
        label: "📍 Lokatsiya",
        value: [locName || "", locUrl || ""]
          .filter(Boolean)
          .join(locName && locUrl ? " — " : ""),
      });
    }
  }

  const channelsBlock = buildChannelsHtml(channelsText);
  if (rows.length === 0) return channelsBlock || "";

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

  const rowsTable = `
    <table class="detail-table" width="100%" style="background:#f8f9fb; border-radius:8px; padding:12px 10px; margin:10px 0 14px 0; border:1px solid #eef1f4;">
      ${items}
    </table>
  `;

  return `${rowsTable}${channelsBlock || ""}`;
}
