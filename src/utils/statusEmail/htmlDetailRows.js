/**
 * HTML detail rows and channels block builders for status emails.
 */

import { escapeHtml, formatInterviewDateTime } from "./helpers";

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

export function buildDetailRows({ additionalInfo, decisionNote, channelsText }) {
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
