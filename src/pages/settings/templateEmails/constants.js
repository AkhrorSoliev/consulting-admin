import { getStatusEmailCopy } from "../../../utils/statusEmail";

export const STAGES = [
  { value: "stage_1", label: "Stufe 1" },
  { value: "stage_2", label: "Stufe 2" },
  { value: "stage_2_result", label: "Stufe 2 Ergebnis" },
  { value: "stage_3", label: "Stufe 3" },
  { value: "stage_4", label: "Stufe 4" },
];

export const DECISIONS = [
  { value: "accepted", label: "Angenommen" },
  { value: "rejected", label: "Abgelehnt" },
];

export function buildDefaultForm(stage, decision) {
  const copy = getStatusEmailCopy(stage, decision);
  return {
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "",
    subject: String(copy?.subject || ""),
    mainText: String(copy?.mainText || ""),
    nextStepNote: String(copy?.nextStepNote || ""),
    channelsText: String(copy?.channelsText || ""),
    emphasizeMainText: true,
  };
}

export function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "";
  }
}

const FORM_FIELDS = [
  "emailTitle",
  "statusLabel",
  "subject",
  "mainText",
  "nextStepNote",
  "channelsText",
];

export function mergeTemplateWithDefaults(base, activeTemplate) {
  const next = { ...base };
  for (const key of FORM_FIELDS) {
    if (activeTemplate[key] !== undefined) {
      next[key] = String(activeTemplate[key] || "");
    }
  }
  if (activeTemplate.emphasizeMainText !== undefined) {
    next.emphasizeMainText = Boolean(activeTemplate.emphasizeMainText);
  }
  return next;
}
