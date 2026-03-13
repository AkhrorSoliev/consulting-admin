import { normalizePassportNumber } from "../../../../utils/validation";
import { normalizeMonth, normalizeWorkRecord } from "./helpers";
import { parseEducation } from "./educationParser";

export function mapDocToForm(data, debugGenerate = false) {
  const p = data?.persoenlicheDaten || {};
  const legacyPersonal = data?.personalInfo || data?.personal || {};
  const rawLicense = p?.fuehrerschein;
  const rawLicenseType = p?.fuehrerscheinTyp;
  const licenseTypeFromLegacy =
    typeof rawLicense === "string" &&
    rawLicense &&
    !["ja", "true", "nein", "false"].includes(
      String(rawLicense).trim().toLowerCase(),
    )
      ? String(rawLicense).trim()
      : "";
  const hasDrivingLicense =
    rawLicense === true ||
    rawLicense === 1 ||
    String(rawLicense || "")
      .trim()
      .toLowerCase() === "ja" ||
    String(rawLicense || "")
      .trim()
      .toLowerCase() === "true" ||
    Boolean(String(rawLicenseType || "").trim()) ||
    Boolean(licenseTypeFromLegacy);
  const drivingLicenseType = String(
    rawLicenseType || licenseTypeFromLegacy || "",
  )
    .trim()
    .toUpperCase();

  const rawBerufe = Array.isArray(data?.berufserfahrung)
    ? data.berufserfahrung
    : [];
  const berufe = rawBerufe.map(normalizeWorkRecord).filter(Boolean);

  const ausb = parseEducation(data, debugGenerate);

  const f = data?.faehigkeiten || {};
  const docs = data?.documents || {};

  let diplomas = Array.isArray(docs?.diplomas)
    ? docs.diplomas.map((u) => String(u || "").trim()).filter(Boolean)
    : [];

  const certificates = Array.isArray(docs?.certificates)
    ? docs.certificates.map((u) => String(u || "").trim()).filter(Boolean)
    : [];

  const certificatesDetailed = Array.isArray(docs?.certificatesDetailed)
    ? docs.certificatesDetailed.map((cert) => ({
        url: String(cert?.url || "").trim(),
        type: String(cert?.type || "").trim(),
      }))
    : [];

  let passportUnique = Array.isArray(docs?.passport)
    ? docs.passport.map((p) => String(p || "").trim()).filter(Boolean)
    : [];

  if (passportUnique.length === 0 && diplomas.length > 0) {
    const passIdx = diplomas.findIndex((u) =>
      /pass|reisepass/i.test(String(u || "")),
    );
    if (passIdx >= 0) {
      passportUnique = [diplomas[passIdx]];
      diplomas = diplomas.filter((_, i) => i !== passIdx);
    }
  }

  if (passportUnique.length > 0 && diplomas.length > 0) {
    const passSet = new Set(passportUnique);
    diplomas = diplomas.filter((u) => !passSet.has(u));
  }

  const rawChildrenCount = String(p.kinderAnzahl ?? "").trim();
  const noChildrenFromDoc = Boolean(p.keinKinder);
  const inferredNoChildren =
    noChildrenFromDoc || rawChildrenCount === "" || rawChildrenCount === "0";
  const childrenCount = inferredNoChildren ? "" : rawChildrenCount;

  return {
    personalInfo: {
      name: String(p.name || ""),
      lastName: String(p.nachname || ""),
      gender: String(p.geschlecht || ""),
      address: String(p.adresse || ""),
      birthDate: String(p.geburtsdatum || ""),
      birthPlace: String(p.geburtsort || ""),
      maritalStatus: String(p.familienstand || ""),
      childrenCount,
      noChildren: inferredNoChildren,
      hasDrivingLicense,
      drivingLicenseType,
      phone: String(p.telefon || ""),
      passportNumber: normalizePassportNumber(
        p?.reisepassNummer ||
          data?.passportId ||
          p?.passportId ||
          p?.passportNumber ||
          data?.reisepassNummer ||
          "",
      ),
      email: String(
        p.email ||
          legacyPersonal?.email ||
          data?.email ||
          data?.emailAddress ||
          data?.email_address ||
          "",
      ).trim(),
      photo: String(p.foto || ""),
    },
    experience: berufe.map((b) => ({
      startDate: normalizeMonth(b?.beginn),
      endDate: normalizeMonth(b?.ende),
      position: String(b?.position || ""),
      company: String(b?.unternehmen || ""),
      location: String(b?.ort || ""),
      responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
    })),
    education: (() => {
      const mappedEducation = ausb.map((a) => ({
        startDate: normalizeMonth(a?.beginn),
        endDate: normalizeMonth(a?.ende),
        institution: String(a?.bildungseinrichtung || ""),
        degree: String(a?.abschluss || ""),
      }));
      if (debugGenerate) {
        console.log("Final education array:", mappedEducation);
      }
      return mappedEducation;
    })(),
    skills: {
      softSkills: Array.isArray(f?.sozialkompetenzen)
        ? f.sozialkompetenzen
        : [],
      pcSkills: Array.isArray(f?.pcKenntnisse) ? f.pcKenntnisse : [],
      languages:
        typeof f?.sprachen === "object" && f?.sprachen !== null
          ? f.sprachen
          : {},
    },
    documents: {
      diplomas,
      certificates,
      certificatesDetailed,
      passport: passportUnique,
      noLanguageCertificate: Boolean(docs?.noLanguageCertificate),
    },
    commentar: String(data?.commentar || ""),
  };
}
