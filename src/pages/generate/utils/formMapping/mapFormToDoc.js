import { deleteField } from "firebase/firestore";
import { normalizePassportNumber } from "../../../../utils/validation";
import { getCommentHtml } from "./helpers";

export function mapFormToDoc(f) {
  const noChildren = Boolean(f?.personalInfo?.noChildren);
  const passportNumber = normalizePassportNumber(
    f?.personalInfo?.passportNumber || "",
  );

  const languages =
    f.skills?.languages && typeof f.skills.languages === "object"
      ? f.skills.languages
      : {};
  const hasLanguages = Object.keys(languages).length > 0;

  return {
    persoenlicheDaten: {
      name: f.personalInfo.name,
      nachname: f.personalInfo.lastName,
      geschlecht: f.personalInfo.gender,
      adresse: f.personalInfo.address,
      geburtsdatum: f.personalInfo.birthDate,
      geburtsort: String(f?.personalInfo?.birthPlace || "").trim(),
      familienstand: f.personalInfo.maritalStatus,
      kinderAnzahl: noChildren
        ? ""
        : String(f.personalInfo.childrenCount || ""),
      keinKinder: noChildren,
      fuehrerschein: Boolean(f?.personalInfo?.hasDrivingLicense),
      fuehrerscheinTyp: String(f?.personalInfo?.drivingLicenseType || "")
        .trim()
        .toUpperCase(),
      telefon: f.personalInfo.phone,
      email: f.personalInfo.email,
      reisepassNummer: passportNumber,
      foto: f.personalInfo.photo,
    },
    passportId: passportNumber || null,
    berufserfahrung: Array.isArray(f.experience)
      ? f.experience.map((exp) => ({
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
    ausbildung: Array.isArray(f.education)
      ? f.education.map((edu) => ({
          beginn: edu.startDate,
          ende: edu.endDate,
          bildungseinrichtung: edu.institution,
          abschluss: edu.degree || "",
        }))
      : [],
    faehigkeiten: {
      sozialkompetenzen: f.skills?.softSkills || [],
      pcKenntnisse: f.skills?.pcSkills || [],
      sprachen: hasLanguages ? languages : deleteField(),
    },
    documents: {
      diplomas: f.documents?.diplomas || [],
      certificates: f.documents?.certificates || [],
      certificatesDetailed: Array.isArray(f?.documents?.certificatesDetailed)
        ? f.documents.certificatesDetailed.map((cert) => ({
            url: String(cert?.url || "").trim(),
            type: String(cert?.type || "").trim(),
          }))
        : [],
      passport: Array.isArray(f.documents?.passport)
        ? f.documents.passport
        : f.documents?.passport
          ? [f.documents.passport]
          : [],
      noLanguageCertificate: Boolean(f?.documents?.noLanguageCertificate),
    },
    commentar: String(getCommentHtml(f) || ""),
  };
}
