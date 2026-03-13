/**
 * Builds the full status email template (plain text + HTML).
 */

import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
} from "../../constants/candidateStatus";
import {
  buildFullName,
  buildKeyValueBlock,
  formatInterviewDateTime,
  normalizeDecision,
  applyCopyOverrides,
} from "./helpers";
import { pickStageCopy } from "./stageCopy";
import { buildHtmlEmail } from "./htmlEmail";

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
