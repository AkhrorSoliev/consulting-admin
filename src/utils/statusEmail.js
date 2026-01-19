import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
} from "../constants/candidateStatus";

function escapeHtml(value) {
  // Only escape characters that would break HTML structure
  // Telegram supports UTF-8 directly, so curly quotes don't need escaping
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
        subject: "✅ 1-bosqich: Ichki suhbatga taklif",
        emailTitle: "Ichki suhbatga taklif",
        statusLabel: "1-bosqich (ichki suhbat) — kutilmoqda",
        mainText:
          "Sizning arizangiz ko'rib chiqildi. 1-bosqich — ichki suhbat uchun navbat belgilandi.",
        nextStepNote:
          "Iltimos, belgilangan vaqt va ko'rsatmalarga amal qiling. Qo'shimcha ma'lumotlar kerak bo'lsa, siz bilan bog'lanamiz.",
        ...commonClosing,
      };
    }
    return {
      subject: "❌ 1-bosqich: Rad etildi",
      emailTitle: "Arizangiz ko'rib chiqildi",
      statusLabel: "1-bosqich — rad etildi",
      mainText:
        "Sizning arizangiz diqqat bilan ko'rib chiqildi. Afsuski, hujjatlaringiz ushbu lavozim talablariga to'liq mos kelmadi.",
      nextStepNote:
        "Sizga boshqa mavjud bo'sh ish o'rinlarimizga ariza topshirib, qayta urinib ko'rishingizni tavsiya qilamiz. Qiziqishingiz va vaqtingiz uchun samimiy minnatdorchilik bildiramiz.",
      ...commonClosing,
    };
  }

  if (stage === "stage_2") {
    if (d === "accepted") {
      return {
        subject: "✅ 2-bosqich: Ariza holati yangilandi",
        emailTitle: "Ariza holati yangilandi",
        statusLabel: "2-bosqich — hujjatlar ish beruvchiga yuborilmoqda",
        mainText:
          "Tabriklaymiz! Siz 1-bosqich ichki suhbatdan muvaffaqiyatli o'tdingiz.",
        nextStepNote:
          "Suhbatga oid barcha zarur ma'lumotlar (sana, vaqt va havola) quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang.",
        examples: [
          {
            id: "example1",
            title: "1-misol: Standart tabrik",
            content:
              "Sizning hujjatlaringiz to'liq holatda ish beruvchiga yuboriladi. Ish beruvchi hujjatlaringizni ko'rib chiqadi. Agar sizning hujjatlaringiz ish beruvchiga ma'qul kelsa, sizi suhbatga taklif etadi. Suhbat kuni, joyi va vaqti haqida tez orada elektron pochta orqali sizga xabar yuboramiz.",
          },
          {
            id: "example2",
            title: "2-misol: Yuqori rahbariyat bilan suhbat",
            content: `Siz ConsultingUz rahbari Orif Akhmadaliyev bilan ikkinchi bosqich ichki suhbatga taklif qilinasiz.

Suhbatga oid barcha zarur ma'lumotlar quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang.

Keyingi bosqichlar bo'yicha batafsil ma'lumotlar Sizga qo'shimcha tarzda taqdim etiladi. Jarayon davomida qo'shimcha ma'lumot zarur bo'lsa, Siz bilan bevosita bog'lanamiz.`,
          },
        ],
        ...commonClosing,
      };
    }
    return {
      subject: "❌ 2-bosqich: Rad etildi",
      emailTitle: "Ariza holati yangilandi",
      statusLabel: "2-bosqich — rad etildi",
      mainText:
        "Afsuski, tanlov jarayonining 2-bosqichida sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
      nextStepNote:
        "Qaror tanlov mezonlari asosida qabul qilindi. Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa imkoniyatlar paydo bo'lganda, qayta urinib ko'rishingizni tavsiya qilamiz.",
      ...commonClosing,
    };
  }

  if (stage === "stage_2_result") {
    if (d === "accepted") {
      return {
        subject:
          "✅ 2-bosqich natijasi: Yuqori rahbariyat bilan suhbatdan o'tdingiz",
        emailTitle: "Yuqori rahbariyat bilan suhbat natijasi",
        statusLabel: "2-bosqich natijasi — qabul qilindi",
        mainText:
          "Tabriklaymiz! Siz yuqori rahbariyat bilan suhbatdan muvaffaqiyatli o'tdingiz. Sizning bilim, tajriba va professional ko'nikmalaringiz yuqori baholandi.",
        nextStepNote:
          "Sizning hujjatlaringiz to'liq holatda ish beruvchiga yuboriladi. Ish beruvchi hujjatlaringizni ko'rib chiqadi. Agar sizning hujjatlaringiz ish beruvchiga ma'qul kelsa, sizi suhbatga taklif etadi. Suhbat kuni, joyi va vaqti haqida tez orada elektron pochta orqali sizga xabar yuboramiz.",
        ...commonClosing,
      };
    }
    return {
      subject: "❌ 2-bosqich natijasi: Rad etildi",
      emailTitle: "Ariza holati yangilandi",
      statusLabel: "2-bosqich natijasi — rad etildi",
      mainText:
        "Afsuski, yuqori rahbariyat bilan suhbat natijalariga ko'ra, sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
      nextStepNote:
        "Qaror tanlov mezonlari va kompaniya talablari asosida qabul qilindi. Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa imkoniyatlar paydo bo'lganda, qayta urinib ko'rishingizni tavsiya qilamiz.",
      ...commonClosing,
    };
  }

  if (stage === "stage_3") {
    if (d === "accepted") {
      return {
        subject: "✅ 3-bosqich: Ish beruvchi bilan suhbatga taklif",
        emailTitle: "Ish beruvchi bilan suhbatga taklif",
        statusLabel: "3-bosqich (ish beruvchi bilan suhbat) — kutilmoqda",
        mainText:
          "Tabriklaymiz! Siz tanlov jarayonining 3-bosqichiga muvaffaqiyatli o'tdingiz. Endi ish beruvchi bilan bevosita suhbatga taklif qilinasiz.",
        nextStepNote:
          "Suhbat tafsilotlari (sana, vaqt va havola) quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang va suhbatga yaxshi tayyorgarlik ko'ring.",
        ...commonClosing,
      };
    }
    return {
      subject: "❌ 3-bosqich: Rad etildi",
      emailTitle: "Ariza holati yangilandi",
      statusLabel: "3-bosqich — rad etildi",
      mainText:
        "Afsuski, tanlov jarayonining 3-bosqichida sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
      nextStepNote:
        "Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa mos imkoniyatlar paydo bo'lganda, qayta ariza topshirishingizni tavsiya qilamiz.",
      ...commonClosing,
    };
  }

  // stage_4
  if (d === "accepted") {
    return {
      subject: "✅ 4-bosqich: Hujjatlarni yuklash",
      emailTitle: "Hujjatlarni yuklash",
      statusLabel: "4-bosqich (hujjatlar yuklash) — kutilmoqda",
      mainText:
        "Tabriklaymiz! Siz ish beruvchi bilan o'tkazilgan suhbatdan muvaffaqiyatli o'tdingiz. Endi yakuniy bosqich — zarur hujjatlarni yuklash bosqichiga o'tdingiz.",
      nextStepNote:
        "Iltimos, quyidagi havola orqali tizimga kirib, talab etilgan barcha hujjatlarni yuklang. Imzolanishi kerak bo'lgan hujjatlarni yuklab olib, imzolaganingizdan so'ng, qayta yuklashingizni so'raymiz.",
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 4-bosqich: Rad etildi",
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "4-bosqich — rad etildi",
    mainText:
      "Afsuski, tanlov jarayonining yakuniy bosqichida sizning nomzodingiz bo'yicha ijobiy qaror qabul qilinmadi.",
    nextStepNote:
      "Qiziqishingiz va jarayonga ajratgan barcha vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida mos imkoniyatlar paydo bo'lganda, sizni xabardor qilishimiz mumkin.",
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
  dataExchangeLink,
  channelInviteLink,
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

  const safeChannelLink = String(channelInviteLink || "").trim();

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
    normalizedStatusValue === "stage_4" &&
    decision === "accepted" &&
    dataExchangeLink
      ? { label: "Hujjatlar yuklash havolasi", value: dataExchangeLink }
      : null,
    safeChannelLink
      ? { label: "Yangiliklar kanaliga a'zo bo'lish", value: safeChannelLink }
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

  const safeChannelInviteLink = String(channelInviteLink || "").trim();

  const htmlContent = buildHtmlEmail({
    fullName,
    statusLabel: statusLabelText,
    emailTitle,
    mainText,
    nextStepNote,
    additionalInfo:
      dateTime ||
      link ||
      locationName ||
      locationUrl ||
      safeChannelInviteLink ||
      (normalizedStatusValue === "stage_4" &&
        decision === "accepted" &&
        dataExchangeLink)
        ? {
            dateTime: dateTime || "",
            link: link || "",
            locationName: locationName || "",
            locationUrl: locationUrl || "",
            dataExchangeLink:
              normalizedStatusValue === "stage_4" && decision === "accepted"
                ? dataExchangeLink || ""
                : "",
            channelInviteLink: safeChannelInviteLink,
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
    const dataExchangeLink = String(
      additionalInfo.dataExchangeLink || ""
    ).trim();
    const channelInviteLink = String(
      additionalInfo.channelInviteLink || ""
    ).trim();
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
    if (dataExchangeLink) {
      rows.push({
        label: "📄 Hujjatlar yuklash havolasi",
        value: dataExchangeLink,
      });
    }
    if (channelInviteLink) {
      rows.push({
        label: "📢 Yangiliklar kanaliga a'zo bo'lish",
        value: channelInviteLink,
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

/**
 * Build a clean Telegram-formatted message (no HTML email conversion)
 * @param {Object} params
 * @returns {Object} { message: string, keyboard: Array } Telegram message with inline keyboard
 */
export function buildTelegramStatusMessage({
  statusValue,
  firstName,
  lastName,
  stageDecision,
  decisionNote,
  additionalInfo,
  copyOverrides,
  dataExchangeLink,
  channelInviteLink,
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

  // Build message parts with new improved format
  const parts = [];

  // Header with emoji
  parts.push(`📧 <b>${escapeHtml(emailTitle)}</b>`);
  parts.push("");

  // Greeting
  parts.push(`👤 <b>Hurmatli ${escapeHtml(fullName)},</b>`);
  parts.push("");

  // Main intro
  parts.push(
    `Sizning arizangiz holatini yangiladik. Quyida joriy holat va keyingi qadamlar bilan tanishishingiz mumkin.`
  );
  parts.push("");

  // Status
  parts.push(`🟢 <b>Holat: ${escapeHtml(statusLabelText)}</b>`);
  parts.push("");

  // Main text
  if (mainText) {
    parts.push(`📋 <b>Ma'lumot:</b>`);
    parts.push(`${escapeHtml(mainText)}`);
    parts.push("");
  }

  // Next step note
  if (nextStepNote) {
    parts.push(`${escapeHtml(nextStepNote)}`);
    parts.push("");
  }

  // Decision note
  if (decisionNote) {
    parts.push(`💬 <i>Qo'shimcha izoh:</i> ${escapeHtml(decisionNote)}`);
    parts.push("");
  }

  // Additional info section
  const dt = String(additionalInfo?.dateTime || "").trim();
  const link = String(additionalInfo?.link || "").trim();
  const locName = String(additionalInfo?.locationName || "").trim();
  const locUrl = String(additionalInfo?.locationUrl || "").trim();
  const dataExchangeLinkTg = String(dataExchangeLink || "").trim();
  const channelInviteLinkTg = String(channelInviteLink || "").trim();

  if (dt || link || locName || locUrl || dataExchangeLinkTg || channelInviteLinkTg) {
    parts.push(`━━━━━━━━━━━━━━━`);
    parts.push(`📋 <b>Qo'shimcha ma'lumotlar:</b>`);
    parts.push("");

    if (dt) {
      parts.push(
        `🗓 <b>Sana / Vaqt: ${escapeHtml(formatInterviewDateTime(dt))}</b>`
      );
    }
    if (link) {
      const linkType = String(additionalInfo?.linkType || "").toLowerCase();
      const linkLabel =
        linkType === "telegram"
          ? "Suhbat uchun Telegram havolasi"
          : "Suhbat uchun havola";
      parts.push(
        `🔗 <b>${linkLabel}:</b> <a href="${link}">Guruhga qo'shilish</a>`
      );
    }
    if (locName || locUrl) {
      if (locUrl) {
        parts.push(
          `📍 <b>Lokatsiya:</b> <a href="${locUrl}">${escapeHtml(
            locName || "Manzilni ko'rish"
          )}</a>`
        );
      } else {
        parts.push(`📍 <b>Lokatsiya:</b> ${escapeHtml(locName)}`);
      }
    }
    if (dataExchangeLinkTg) {
      parts.push(
        `📄 <b>Hujjatlar yuklash havolasi:</b> <a href="${dataExchangeLinkTg}">Hujjatlarni yuklash</a>`
      );
    }
    if (channelInviteLinkTg) {
      parts.push(
        `📢 <b>Yangiliklar kanaliga a'zo bo'lish:</b> <a href="${channelInviteLinkTg}">Kanalga qo'shilish</a>`
      );
    }
    parts.push("");
  }

  // Channels info with improved formatting
  parts.push(`━━━━━━━━━━━━━━━`);
  parts.push(`📢 <b>Foydali havolalar:</b>`);
  parts.push("");
  parts.push(
    `📌 <b>ConsultingUz rasmiy kanali:</b> <a href="https://t.me/Consulting_UZB">Kanalga o'tish</a>`
  );
  parts.push(
    `📍 <b>O'zbekiston bo'ylab nemis tili markazlarimiz:</b> <a href="https://t.me/dafsprachzentrum">Markazlar ro'yxati</a>`
  );
  parts.push("");
  parts.push(`━━━━━━━━━━━━━━━`);
  parts.push("");

  // Closing
  parts.push(`🤝 <b>Hurmat bilan,</b>`);
  parts.push(`<b>ConsultingUz jamoasi</b>`);

  // Build inline keyboard
  const keyboard = [];

  // Helper function to check if URL is valid for Telegram (not localhost)
  const isValidTelegramUrl = (url) => {
    if (!url) return false;
    const urlStr = String(url).trim().toLowerCase();
    // Reject localhost, 127.0.0.1, and empty URLs
    if (
      urlStr.includes("localhost") ||
      urlStr.includes("127.0.0.1") ||
      urlStr.startsWith("http://192.168.") ||
      urlStr.startsWith("http://10.") ||
      urlStr.startsWith("http://172.")
    ) {
      console.warn("Skipping localhost/private URL for Telegram:", url);
      return false;
    }
    return urlStr.startsWith("http://") || urlStr.startsWith("https://");
  };

  // Add interview link button if available and valid
  if (link && isValidTelegramUrl(link)) {
    const linkType = String(additionalInfo?.linkType || "").toLowerCase();
    const buttonText =
      linkType === "telegram"
        ? "🔗 Suhbat guruhiga qo'shilish"
        : "🔗 Suhbatga qo'shilish";
    keyboard.push([{ text: buttonText, url: link }]);
  }

  // Add DataExchange link button for stage_4 accepted (only if valid)
  if (dataExchangeLinkTg && isValidTelegramUrl(dataExchangeLinkTg)) {
    keyboard.push([
      { text: "📄 Hujjatlarni yuklash", url: dataExchangeLinkTg },
    ]);
  }

  // Add channel invite link button if available and valid
  if (channelInviteLinkTg && isValidTelegramUrl(channelInviteLinkTg)) {
    keyboard.push([
      { text: "📢 Yangiliklar kanaliga qo'shilish", url: channelInviteLinkTg },
    ]);
  }

  // Add channel buttons
  keyboard.push([
    { text: "📌 ConsultingUz kanali", url: "https://t.me/Consulting_UZB" },
    { text: "📍 Nemis tili markazlari", url: "https://t.me/dafsprachzentrum" },
  ]);

  return {
    message: parts.join("\n"),
    keyboard: keyboard.length > 0 ? keyboard : null,
  };
}
