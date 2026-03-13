/**
 * HTML email template builder for status emails.
 */

import { escapeHtml } from "./helpers";
import { buildDetailRows } from "./htmlDetailRows";

export function buildHtmlEmail({
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
