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
  const safeRows = Array.isArray(rows)
    ? rows.filter((r) => r && r.value)
    : [];
  if (safeRows.length === 0) return "";
  const lines = safeRows.map((r) => `• ${r.label}: ${r.value}`);
  return [title, ...lines].join("\n");
}

function normalizeDecision(decisionRaw) {
  return decisionRaw === "rejected" ? "rejected" : "accepted";
}

export function getStatusEmailCopy(stage, decision) {
  const d = normalizeDecision(decision);

  const telegramChannelsText = [
    "Qo'shimcha ma'lumotlar uchun Telegram kanallarimiz:",
    "ConsultingUz rasmiy kanali: https://t.me/Consulting_UZB",
    "O‘zbekiston bo‘ylab nemis tili markazlarimiz: https://t.me/dafsprachzentrum",
  ].join("\n");

  const commonClosing = {
    channelsText: telegramChannelsText,
    closing: "Hurmat bilan,\nConsultingUZ jamoasi",
  };

  if (stage === "stage_1") {
    if (d === "accepted") {
      return {
        subject: "1-bosqich kutilmoqda",
        title: "1-bosqich (ichki suhbat) kutilmoqda",
        mainText:
          "Sizning arizangiz ko‘rib chiqildi. 1-bosqich – ichki suhbat uchun navbat belgilandi.",
        nextStepNote:
          "Iltimos, belgilangan vaqt va ko‘rsatmalarga amal qiling. Qo‘shimcha ma’lumotlar kerak bo‘lsa, siz bilan bog‘lanamiz.",
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
        subject: "Ichki suhbatdan o'tdi",
        title: "1-bosqich yakunlandi",
        mainText:
          "Siz ichki suhbatdan muvaffaqiyatli o‘tdingiz. Keyingi bosqichga o‘tish uchun tayyorlaning.",
        nextStepNote:
          "Tez orada ish beruvchi bilan suhbatga taklif va tafsilotlar yuboriladi.",
        ...commonClosing,
      };
    }
    return {
      subject: "Ichki suhbatdan rad etildi",
      title: "1-bosqich yakunlandi",
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
        subject: "Ish beruvchi bilan suhbatga taklif",
        title: "Ish beruvchi bilan suhbatga taklif etildingiz",
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
      subject: "Ish beruvchi qabul qildi",
      title: "Ish beruvchi qarori: qabul qilindi",
      mainText:
        "Tabriklaymiz! Ish beruvchi Sizni qabul qildi. Keyingi hujjatlar va ko‘rsatmalar bilan tanishing.",
      nextStepNote:
        "Shartnoma va hujjatlar bo‘yicha ko‘rsatmalarga rioya qiling. Qo‘shimcha savollaringiz bo‘lsa, biz bilan bog‘laning.",
      ...commonClosing,
    };
  }
  return {
    subject: "Ish beruvchi rad qildi",
    title: "Ish beruvchi qarori: rad etildi",
    mainText:
      "Afsuski, tanlov jarayonining yakuniy bosqichida Sizning nomzodingiz bo‘yicha ijobiy qaror qabul qilinmadi.",
    nextStepNote:
      "Qiziqishingiz va vaqtingiz uchun minnatdorchilik bildiramiz. Kelgusida mos bo‘sh ish o‘rinlarimiz paydo bo‘lsa, Sizni xabardor qilishimiz mumkin.",
    ...commonClosing,
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

  const greeting = `Hurmatli ${fullName},`;
  const decision = normalizeDecision(stageDecision);
  const baseCopy = getStatusEmailCopy(normalizedStatusValue, decision);
  const overrides =
    copyOverrides && typeof copyOverrides === "object" ? copyOverrides : {};
  const copy = {
    ...baseCopy,
    emailTitle:
      overrides.emailTitle !== undefined && overrides.emailTitle !== null
        ? String(overrides.emailTitle)
        : undefined,
    statusLabel:
      overrides.statusLabel !== undefined && overrides.statusLabel !== null
        ? String(overrides.statusLabel)
        : undefined,
    emphasizeMainText:
      overrides.emphasizeMainText !== undefined &&
      overrides.emphasizeMainText !== null
        ? Boolean(overrides.emphasizeMainText)
        : true,
    subject:
      overrides.subject !== undefined && overrides.subject !== null
        ? String(overrides.subject)
        : baseCopy.subject,
    mainText:
      overrides.mainText !== undefined && overrides.mainText !== null
        ? String(overrides.mainText)
        : baseCopy.mainText,
    nextStepNote:
      overrides.nextStepNote !== undefined && overrides.nextStepNote !== null
        ? String(overrides.nextStepNote)
        : baseCopy.nextStepNote,
    channelsText:
      overrides.channelsText !== undefined && overrides.channelsText !== null
        ? String(overrides.channelsText)
        : baseCopy.channelsText,
  };

  const statusLabelText = String(copy.statusLabel || "").trim() || status.label;
  const mainText = copy.mainText;
  const nextStepNote = copy.nextStepNote;

  const dateTime = String(additionalInfo?.dateTime || "").trim();
  const link = String(additionalInfo?.link || "").trim();
  const linkType =
    additionalInfo?.linkType === "telegram" ? "telegram" : "zoom";
  const linkLabel = linkType === "telegram" ? "Telegram link" : "Zoom link";
  const locationUrl = String(additionalInfo?.locationUrl || "").trim();
  const locationNameRaw = String(additionalInfo?.locationName || "").trim();
  const locationName = locationNameRaw || locationUrl;
  const displayLocationName = locationName || locationUrl;
  const locationValue =
    locationUrl && displayLocationName && displayLocationName !== locationUrl
      ? `${displayLocationName} - ${locationUrl}`
      : displayLocationName || locationUrl;

  const extraRows =
    normalizedStatusValue === "stage_2"
      ? []
      : [
          dateTime
            ? { label: "Sana / vaqt", value: formatInterviewDateTime(dateTime) }
            : null,
          link ? { label: linkLabel, value: link } : null,
          locationValue
            ? {
                label: "Lokatsiya",
                value: locationValue,
              }
            : null,
        ].filter(Boolean);

  const detailBlock =
    normalizedStatusValue === "stage_2"
      ? ""
      : buildKeyValueBlock("Qo'shimcha ma'lumotlar:", extraRows);

  const channelsBlock = copy.channelsText ? `\n${copy.channelsText}\n` : "";

  const parts = [
    greeting,
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
    emailTitle: copy.emailTitle,
    emphasizeMainText: copy.emphasizeMainText,
    fullName,
    statusLabel: statusLabelText,
    mainText,
    nextStepNote,
    additionalInfo:
      normalizedStatusValue === "stage_2"
        ? null
        : {
            dateTime: dateTime || "",
            link: link || "",
            linkType,
            locationName: displayLocationName,
            locationUrl,
          },
    decisionNote: decisionNote || "",
    channelsHtml: copy.channelsText || "",
  });

  return {
    subject: copy.subject || `Arizangiz holati: ${statusLabelText}`,
    message,
    htmlContent,
    statusLabel: statusLabelText,
  };
}

function buildHtmlEmail({
  emailTitle,
  emphasizeMainText = true,
  fullName,
  statusLabel,
  mainText,
  nextStepNote,
  decisionNote,
  additionalInfo,
  channelsHtml,
}) {
  const detailRows = buildDetailRows({
    additionalInfo,
    decisionNote,
    channelsText: channelsHtml,
  });

  const safeEmailTitle =
    String(emailTitle || "").trim() || "Ariza holati yangilandi";
  const safeMainText = escapeHtml(mainText);
  const mainTextHtml = emphasizeMainText
    ? `<strong>${safeMainText}</strong>`
    : safeMainText;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(safeEmailTitle)}</title>
  <style>
    /* Inter web-font (some email clients may ignore; fallbacks below will apply) */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.04); font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <tr>
            <td style="text-align:center; padding-bottom:16px;">
              <h2 style="margin:0; color:#2c3e50; font-size:22px;">${escapeHtml(
                safeEmailTitle
              )}</h2>
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
              <p style="margin:0 0 14px 0; color:#1f2d3d;">${mainTextHtml}</p>
              <p style="margin:0 0 14px 0;">${escapeHtml(nextStepNote)}</p>
              ${detailRows}
              ${
                decisionNote
                  ? `<p style="margin:10px 0 0 0; color:#3a4a5e;">Qo'shimcha izoh: ${escapeHtml(
                      decisionNote
                    )}</p>`
                  : ""
              }
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

function buildChannelsHtml(channelsText) {
  const raw = String(channelsText || "").trim();
  if (!raw) return "";
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  const titleLine = lines[0];
  const candidateLines = lines.slice(1);

  const telegramIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="Telegram" style="display:block">
      <path fill="#1e7dd1" d="M22.5 3.5L2.6 11.2c-1.4.5-1.4 1.3-.3 1.6l5.1 1.6 2 6.1c.3.8.2 1.1.9 1.1.5 0 .7-.2 1-.5l2.9-2.8 6 4.4c1.1.6 1.8.3 2.1-1l3.5-16.5c.4-1.6-.6-2.3-1.8-1.7zM9.6 14.3l9.9-6.2c.5-.3.9-.1.6.2l-8 7.2-.3 4.2-2-6.2c-.1-.3 0-.6.3-.8z"/>
    </svg>
  `;

  const websiteIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="Website" style="display:block">
      <path fill="#5f6b7a" d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.9 9h-3.2a15.6 15.6 0 00-1.2-5 8.1 8.1 0 014.4 5zM12 4c.9 1.3 1.7 3.5 2.1 7H9.9c.4-3.5 1.2-5.7 2.1-7zM4.9 13h3.2c.2 1.9.7 3.6 1.2 5a8.1 8.1 0 01-4.4-5zm3.2-2H4.9a8.1 8.1 0 014.4-5c-.5 1.4-1 3.1-1.2 5zm1.8 2h4.2c-.4 3.5-1.2 5.7-2.1 7-.9-1.3-1.7-3.5-2.1-7zm6 0h3.2a8.1 8.1 0 01-4.4 5c.5-1.4 1-3.1 1.2-5z"/>
    </svg>
  `;

  function isTelegramUrl(url) {
    const u = String(url || "").toLowerCase();
    return u.includes("t.me/") || u.includes("telegram.me/") || u.includes("telegram.org/");
  }

  const rows = candidateLines
    .map((line) => {
      const cleaned = String(line || "")
        .replace(/\s*::\s*/g, ": ")
        .replace(/^[•\-–—]+\s*/g, "")
        .replace(/^🔹\s*/g, "")
        .trim();

      const m = cleaned.match(/(https?:\/\/\S+)/);
      if (!m) {
        return `
          <tr>
            <td style="padding:10px 10px; border:1px solid #eef1f4; border-radius:10px; background:#ffffff;">
              <div style="font-size:13px; color:#3a4a5e; line-height:1.5;">
                ${escapeHtml(cleaned)}
              </div>
            </td>
          </tr>
        `;
      }

      const url = m[1];
      const before = cleaned.slice(0, cleaned.indexOf(url)).trim();
      const label = before
        .replace(/\s*:\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      const safeLabel = escapeHtml(label || "Telegram kanal");
      const safeUrl = escapeHtml(url);
      const isTg = isTelegramUrl(url);
      const icon = isTg ? telegramIconSvg : websiteIconSvg;

      return `
        <tr>
          <td style="padding:0 0 10px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; border:1px solid #eef1f4; background:#ffffff; border-radius:10px;">
              <tr>
                <td style="width:28px; padding:12px 0 12px 12px; vertical-align:top;">
                  <div style="width:16px; height:16px;">
                    ${icon}
                  </div>
                </td>
                <td style="padding:12px 12px 12px 10px; vertical-align:top;">
                  <div style="font-size:13px; font-weight:bold; color:#1f2d3d; margin:0 0 6px 0;">${safeLabel}</div>
                  <a href="${safeUrl}" style="font-size:13px; color:#1e7dd1; text-decoration:underline; word-break:break-word;">
                    ${safeUrl}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const titleText = escapeHtml(
    String(titleLine || "Qo'shimcha ma'lumotlar").replace(/\s*::\s*/g, ": ")
  );

  return `
    <div style="margin:14px 0 0 0; padding:12px 12px; background:#f8f9fb; border-radius:10px; border:1px solid #eef1f4;">
      <div style="font-weight:bold; color:#1f2d3d; margin-bottom:10px; font-size:14px;">
        ${titleText}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0;">
        ${rows}
      </table>
    </div>
  `;
}

function buildDetailRows({ additionalInfo, decisionNote, channelsText }) {
  const rows = [];

  if (additionalInfo && typeof additionalInfo === "object") {
    const dt = String(additionalInfo.dateTime || "").trim();
    const link = String(additionalInfo.link || "").trim();
    const linkType =
      additionalInfo.linkType === "telegram" ? "telegram" : "zoom";
    const linkLabel =
      linkType === "telegram" ? "🔗 Telegram link" : "🔗 Zoom link";
    const locationUrl = String(additionalInfo.locationUrl || "").trim();
    const locationNameRaw = String(additionalInfo.locationName || "").trim();
    const locationName = locationNameRaw || locationUrl;

    if (dt) {
      rows.push({
        label: "📅 Sana / Vaqt",
        value: formatInterviewDateTime(dt),
      });
    }
    if (link) {
      const safeLink = escapeHtml(link);
      rows.push({
        label: linkLabel,
        valueHtml: `<a href="${safeLink}" style="color:#1e7dd1; text-decoration:underline; word-break:break-word;">${safeLink}</a>`,
      });
    }
    if (locationName || locationUrl) {
      const safeLocationName = escapeHtml(locationName || locationUrl);
      const safeUrl = escapeHtml(locationUrl);
      const valueHtml = locationUrl
        ? `<a href="${safeUrl}" style="color:#1e7dd1; text-decoration:underline; word-break:break-word;">${safeLocationName}</a>`
        : safeLocationName;
      rows.push({
        label: "📍 Lokatsiya",
        valueHtml,
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
          <td style="padding:6px 8px; color:#3a4a5e;">${
            row.valueHtml !== undefined
              ? row.valueHtml
              : escapeHtml(row.value)
          }</td>
        </tr>`
    )
    .join("");

  const rowsTable = `
    <table width="100%" style="background:#f8f9fb; border-radius:8px; padding:12px 10px; margin:10px 0 14px 0; border:1px solid #eef1f4;">
      ${items}
    </table>
  `;

  return `${rowsTable}${channelsBlock || ""}`;
}
