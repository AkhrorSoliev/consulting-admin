import { normalizePassportNumber } from "../../../utils/validation";
import {
  isEducationEntryFilled,
  isExperienceEntryFilled,
  isExperienceEntryEmpty,
  isLanguageEntryFilled,
  getEducationErrors,
  getExperienceErrors,
  getLanguageErrors,
} from "../validationHelpers";

/**
 * Build the "lebenslauf" payload from final form data and CV state.
 */
export function buildLebenslauf(final) {
  const noChildrenSelected = Boolean(final.personalInfo?.noChildren);
  const rawChildrenCount = String(final.personalInfo?.childrenCount || "")
    .trim()
    .replace(/[^\d]/g, "");
  const childrenCount = noChildrenSelected ? "" : rawChildrenCount;

  return {
    persoenlicheDaten: {
      name: final.personalInfo.name,
      nachname: final.personalInfo.lastName,
      geschlecht: final.personalInfo.gender,
      adresse: final.personalInfo.address,
      geburtsdatum: final.personalInfo.birthDate,
      geburtsort: String(final.personalInfo.birthPlace || "").trim(),
      familienstand: final.personalInfo.maritalStatus,
      kinderAnzahl: childrenCount,
      keinKinder: noChildrenSelected,
      fuehrerschein: Boolean(final.personalInfo?.hasDrivingLicense),
      fuehrerscheinTyp: (() => {
        const raw = final.personalInfo?.drivingLicenseType;
        const types = Array.isArray(raw)
          ? raw
          : String(raw || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        return types
          .map((t) =>
            String(t || "")
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean)
          .join(", ");
      })(),
      telefon: final.personalInfo.phone,
      email: final.personalInfo.email,
      reisepassNummer: normalizePassportNumber(
        final?.personalInfo?.passportNumber || "",
      ),
      foto: final.personalInfo.photo,
    },
    berufserfahrung: Array.isArray(final.experience)
      ? final.experience.map((exp) => ({
          beginn: exp.startDate,
          ende: exp.endDate,
          position: exp.position,
          unternehmen: exp.company,
          ort: exp.location,
          aufgaben: Array.isArray(exp.responsibilities)
            ? exp.responsibilities
            : [],
        }))
      : [],
    ausbildung: {
      schule: {
        beginn: final.education?.schule?.startDate || "",
        ende: final.education?.schule?.endDate || "",
        bildungseinrichtung: final.education?.schule?.institution || "",
        abschluss: final.education?.schule?.degree || "",
      },
      kollej:
        final.education?.kollej &&
        (final.education.kollej.startDate ||
          final.education.kollej.endDate ||
          final.education.kollej.institution ||
          final.education.kollej.degree)
          ? {
              beginn: final.education.kollej.startDate || "",
              ende: final.education.kollej.endDate || "",
              bildungseinrichtung: final.education.kollej.institution || "",
              abschluss: final.education.kollej.degree || "",
            }
          : null,
      universitat:
        final.education?.universitat &&
        (final.education.universitat.startDate ||
          final.education.universitat.endDate ||
          final.education.universitat.institution ||
          final.education.universitat.degree)
          ? {
              beginn: final.education.universitat.startDate || "",
              ende: final.education.universitat.endDate || "",
              bildungseinrichtung:
                final.education.universitat.institution || "",
              abschluss: final.education.universitat.degree || "",
            }
          : null,
    },
    faehigkeiten: {
      sozialkompetenzen: final.skills?.softSkills || [],
      pcKenntnisse: final.skills?.pcSkills || [],
      sprachen: final.skills?.languages || {},
    },
  };
}

/**
 * Validate all sections before submit. Returns array of blocking error keys.
 */
export function validateForSubmit({
  captchaToken,
  majorLoading,
  cv,
  languageRows,
  diplomaFiles,
  langCertFiles,
  noLanguageCertificates,
  passportFiles,
  majorCollection,
  setShowEducationWarning,
  setEducationErrors,
  setShowExperienceWarning,
  setExperienceErrors,
  setShowLanguageWarning,
  setLanguageErrors,
  setDiplomaError,
  setLangCertTypeError,
  setPassportError,
}) {
  const blockingErrors = [];

  if (!captchaToken) blockingErrors.push("captcha");
  if (majorLoading) blockingErrors.push("majorLoading");

  if (!isEducationEntryFilled(cv.education?.schule)) {
    setShowEducationWarning(true);
    setEducationErrors(getEducationErrors(cv.education));
    blockingErrors.push("education");
  }

  const hasPartial =
    Array.isArray(cv.experience) &&
    cv.experience.some(
      (exp) => !isExperienceEntryFilled(exp) && !isExperienceEntryEmpty(exp),
    );
  if (hasPartial) {
    setShowExperienceWarning(true);
    setExperienceErrors(getExperienceErrors(cv.experience));
    blockingErrors.push("experience");
  }

  const rows =
    Array.isArray(languageRows) && languageRows.length > 0
      ? languageRows
      : [];
  const hasLanguages =
    rows.length > 0 && rows.every((row) => isLanguageEntryFilled(row));
  if (!hasLanguages) {
    setShowLanguageWarning(true);
    setLanguageErrors(getLanguageErrors(rows));
    blockingErrors.push("language");
  }

  if (!Array.isArray(diplomaFiles) || diplomaFiles.length === 0) {
    setDiplomaError(true);
    blockingErrors.push("diploma");
  } else {
    setDiplomaError(false);
  }

  const hasLangCertFiles =
    Array.isArray(langCertFiles) && langCertFiles.length > 0;
  const hasMissingLangType =
    !noLanguageCertificates && hasLangCertFiles
      ? langCertFiles.some((item) => !String(item?.type || "").trim())
      : false;
  if (hasMissingLangType) {
    setLangCertTypeError(true);
    blockingErrors.push("langCertType");
  } else {
    setLangCertTypeError(false);
  }

  if (!Array.isArray(passportFiles) || passportFiles.length === 0) {
    setPassportError(true);
    blockingErrors.push("passport");
  } else {
    setPassportError(false);
  }

  if (!majorCollection) blockingErrors.push("major");

  return blockingErrors;
}
