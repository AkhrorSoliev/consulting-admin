import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
} from "../../../../constants/candidateStatus";

/**
 * Builds the Firestore payload for saving candidate data.
 *
 * @param {Object} params
 * @param {boolean} params.isLimitedAdmin
 * @param {Object} params.formCv
 * @param {Object} params.formCvWithRealUrls - formCv with uploaded URLs resolved
 * @param {string} params.commentHtml
 * @param {Object|null} params.nextCommentMeta
 * @param {Function} params.mapFormToDoc
 * @returns {Object} payload
 */
export function buildPayload({
  isLimitedAdmin,
  formCv,
  formCvWithRealUrls,
  commentHtml,
  nextCommentMeta,
  mapFormToDoc,
}) {
  const payload = isLimitedAdmin
    ? {
        commentar: String(commentHtml || ""),
        berufserfahrung: Array.isArray(formCv.experience)
          ? formCv.experience.map((exp) => ({
              beginn: exp?.startDate,
              ende: exp?.endDate,
              position: exp?.position,
              unternehmen: exp?.company,
              ort: exp?.location,
              aufgaben: Array.isArray(exp?.responsibilities)
                ? exp.responsibilities
                : [],
            }))
          : [],
        ausbildung: Array.isArray(formCv.education)
          ? formCv.education.map((edu) => ({
              beginn: edu?.startDate,
              ende: edu?.endDate,
              bildungseinrichtung: edu?.institution,
              abschluss: edu?.degree || "",
            }))
          : [],
      }
    : mapFormToDoc(formCvWithRealUrls);

  if (nextCommentMeta) {
    payload.commentarMeta = nextCommentMeta;
  }

  return payload;
}

/**
 * Normalizes language entries from the form, filtering out empty keys/values.
 *
 * @param {Object} formCv
 * @returns {{ cleanedLanguages: Object, hasLanguages: boolean, languageEntries: Array }}
 */
export function normalizeLanguages(formCv) {
  const languageEntries = formCv.skills?.languages
    ? Object.entries(formCv.skills.languages).filter(
        ([key, val]) =>
          key && key.trim() !== "" && val && val.trim() !== "",
      )
    : [];

  const cleanedLanguages = Object.fromEntries(languageEntries);
  const hasLanguages = languageEntries.length > 0;

  return { cleanedLanguages, hasLanguages };
}

/**
 * Detects whether the candidate's email was changed and computes the
 * email-sync related payload fields and state updates.
 *
 * @param {Object} params
 * @returns {{ shouldSyncEmail: boolean, oldEmail: string, newEmail: string, emailPayloadPatch: Object|null }}
 */
export function detectEmailChange({
  isLimitedAdmin,
  docCv,
  formCv,
  user,
  setStatusValue,
  setStatusUpdatedAt,
  setStatusUpdatedBy,
}) {
  const oldEmail = String(docCv?.persoenlicheDaten?.email || "").trim();
  const newEmail = String(formCv?.personalInfo?.email || "").trim();
  const shouldSyncEmail =
    !isLimitedAdmin &&
    Boolean(oldEmail) &&
    Boolean(newEmail) &&
    oldEmail.toLowerCase() !== newEmail.toLowerCase();

  let emailPayloadPatch = null;

  if (shouldSyncEmail) {
    const now = Date.now();
    const resetMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
    emailPayloadPatch = {
      status: {
        value: CANDIDATE_STATUS_DEFAULT,
        label: resetMeta.label,
        updatedAt: now,
        updatedBy: user?.email || user?.uid || "admin",
      },
    };
    setStatusValue(CANDIDATE_STATUS_DEFAULT);
    setStatusUpdatedAt(now);
    setStatusUpdatedBy(user?.email || user?.uid || "admin");
  }

  return { shouldSyncEmail, oldEmail, newEmail, emailPayloadPatch };
}
