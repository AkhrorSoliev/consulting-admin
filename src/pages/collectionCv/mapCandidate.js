import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../../constants/candidateStatus";
import { hasRichTextContent } from "../../utils/commentar";
import { normalizeRating } from "../generate/utils/ratingUtils";
import { calculateAgeFromDDMMYYYY } from "./utils";

/**
 * Map a `cv_index/{collection}/items/{id}` document to the shape the list view uses.
 *
 * The Cloud Function already flattened everything expensive (comment HTML scanning,
 * certificate/experience/language traversal, stage decisions). What is left here is
 * derived on purpose: `age` would go stale in a stored index, and the status label and
 * tone are constant lookups that must not require a backfill when the constants change.
 */
export function mapIndexedCandidate(d) {
  const data = d.data() || {};
  const statusValue =
    normalizeCandidateStatusValue(data.statusValue) || CANDIDATE_STATUS_DEFAULT;
  const statusMeta = getCandidateStatus(statusValue);

  return {
    ...data,
    id: d.id,
    age: calculateAgeFromDDMMYYYY(data.geburtsdatum),
    statusValue,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.badgeTone || "info",
    rating: normalizeRating(data.rating),
    langLevels: Array.isArray(data.langLevels) ? data.langLevels : [],
    stageDecisions:
      data.stageDecisions && typeof data.stageDecisions === "object"
        ? data.stageDecisions
        : {},
  };
}

/**
 * Map a full candidate Firestore document snapshot to a flat candidate object
 * used in the collection list view.
 *
 * Fallback path: used only when the `cv_index` projection is not populated yet.
 */
export function mapCandidate(d) {
  const data = d.data() || {};
  const documents = data.documents || {};
  const langCerts = Array.isArray(documents?.certificates) ? documents.certificates : [];
  const hasCertificate = langCerts.length > 0;
  const hasExperience = Array.isArray(data.berufserfahrung) && data.berufserfahrung.length > 0;
  const langLevels = Object.values(data.faehigkeiten?.sprachen || {})
    .map((lv) => String(lv || "").trim().toUpperCase())
    .filter((lv) => ["A1", "A2", "B1", "B2", "C1", "C2"].includes(lv));
  const pd = data.persoenlicheDaten || {};
  const firstName = String(pd.name || "").trim();
  const lastName = String(pd.nachname || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const age = calculateAgeFromDDMMYYYY(pd.geburtsdatum);
  const hasDrivingLicense = Boolean(pd.fuehrerschein);
  const rawStatusValue = typeof data?.status === "string" ? data.status : data?.status?.value || "";
  const statusValue = normalizeCandidateStatusValue(rawStatusValue) || CANDIDATE_STATUS_DEFAULT;
  const statusMeta = getCandidateStatus(statusValue);
  const emailMeta = data?.emailMeta || {};
  const emailSentCountRaw = emailMeta?.count !== undefined && emailMeta?.count !== null ? emailMeta.count : 0;
  const emailSentCount = typeof emailSentCountRaw === "number" ? emailSentCountRaw : Number(emailSentCountRaw) || 0;
  const commentMeta = data?.commentarMeta || {};
  const stageMeta = data?.stageMeta && typeof data.stageMeta === "object" ? data.stageMeta : {};
  const stageDecisions = {};
  for (const k of ["stage_1", "stage_2", "stage_2_result", "stage_3", "stage_4"]) {
    const raw = stageMeta?.[k]?.decision;
    if (raw === "accepted" || raw === "rejected") {
      stageDecisions[k] = raw;
    }
  }

  return {
    id: d.id,
    createdAt: data.createdAt || 0,
    name: fullName,
    age,
    photo: pd.foto || "",
    phone: pd.telefon || "",
    email: pd.email || "",
    maritalStatus: pd.familienstand || "",
    hasCertificate,
    hasExperience,
    hasDrivingLicense,
    langLevels,
    statusValue,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.badgeTone || "info",
    statusUpdatedAt: data?.status?.updatedAt || null,
    statusUpdatedBy: data?.status?.updatedBy || "",
    emailSentCount,
    emailLastSentAt: emailMeta?.lastSentAt || null,
    emailLastSentBy: emailMeta?.lastSentBy || "",
    emailLastSentByName: emailMeta?.lastSentByName || "",
    emailLastSentByPhoto: emailMeta?.lastSentByPhoto || "",
    hasComment: hasRichTextContent(data?.commentar),
    commentUpdatedAt: commentMeta?.updatedAt || null,
    commentUpdatedBy: commentMeta?.updatedBy || "",
    commentUpdatedByName: commentMeta?.updatedByName || "",
    commentUpdatedByPhoto: commentMeta?.updatedByPhoto || "",
    commentUpdatedByUid: commentMeta?.updatedByUid || "",
    emailLastSentByUid: emailMeta?.lastSentByUid || "",
    statusUpdatedByUid: data?.status?.updatedByUid || "",
    stageDecisions,
    telegramId: data.telegramId || null,
    lead: data.lead || null,
    reaction: data?.reaction || null,
    rating: normalizeRating(data?.rating),
    documentReady: data.documentReady || false,
    isDocumentSend: data.isDocumentSend || false,
  };
}
