import { normalizePassportNumber } from "../../../../utils/validation";
import { getCommentHtml } from "./helpers";

export function normalizeForm(form, initialForm) {
  const safe = form || initialForm;
  const commentHtml = getCommentHtml(safe);
  const langEntries = Object.entries(safe?.skills?.languages || {})
    .filter(([key]) => key !== undefined && key !== null)
    .sort(([a], [b]) => String(a).localeCompare(String(b)));
  return {
    personalInfo: {
      name: String(safe?.personalInfo?.name || "").trim(),
      lastName: String(safe?.personalInfo?.lastName || "").trim(),
      gender: String(safe?.personalInfo?.gender || "").trim(),
      address: String(safe?.personalInfo?.address || "").trim(),
      birthDate: String(safe?.personalInfo?.birthDate || "").trim(),
      birthPlace: String(safe?.personalInfo?.birthPlace || "").trim(),
      maritalStatus: String(safe?.personalInfo?.maritalStatus || "").trim(),
      childrenCount: String(safe?.personalInfo?.childrenCount || "").trim(),
      noChildren: Boolean(safe?.personalInfo?.noChildren),
      hasDrivingLicense: Boolean(safe?.personalInfo?.hasDrivingLicense),
      drivingLicenseType: String(safe?.personalInfo?.drivingLicenseType || "")
        .trim()
        .toUpperCase(),
      phone: String(safe?.personalInfo?.phone || "").trim(),
      passportNumber: normalizePassportNumber(
        safe?.personalInfo?.passportNumber || "",
      ),
      email: String(safe?.personalInfo?.email || "").trim(),
      photo: String(safe?.personalInfo?.photo || "").trim(),
    },
    experience: Array.isArray(safe?.experience)
      ? safe.experience.map((exp) => ({
          startDate: String(exp?.startDate || "").trim(),
          endDate: String(exp?.endDate || "").trim(),
          position: String(exp?.position || "").trim(),
          company: String(exp?.company || "").trim(),
          location: String(exp?.location || "").trim(),
          responsibilities: Array.isArray(exp?.responsibilities)
            ? exp.responsibilities.map((r) => String(r || "").trim())
            : [],
        }))
      : [],
    education: Array.isArray(safe?.education)
      ? safe.education.map((edu) => ({
          startDate: String(edu?.startDate || "").trim(),
          endDate: String(edu?.endDate || "").trim(),
          institution: String(edu?.institution || "").trim(),
          degree: String(edu?.degree || "").trim(),
        }))
      : [],
    skills: {
      softSkills: Array.isArray(safe?.skills?.softSkills)
        ? safe.skills.softSkills.map((s) => String(s || "").trim())
        : [],
      pcSkills: Array.isArray(safe?.skills?.pcSkills)
        ? safe.skills.pcSkills.map((s) => String(s || "").trim())
        : [],
      languages: Object.fromEntries(
        langEntries.map(([k, v]) => [String(k), v]),
      ),
    },
    documents: {
      diplomas: Array.isArray(safe?.documents?.diplomas)
        ? safe.documents.diplomas.map((d) => String(d || ""))
        : [],
      certificates: Array.isArray(safe?.documents?.certificates)
        ? safe.documents.certificates.map((c) => String(c || ""))
        : [],
      certificatesDetailed: Array.isArray(
        safe?.documents?.certificatesDetailed,
      )
        ? safe.documents.certificatesDetailed.map((cert) => ({
            url: String(cert?.url || "").trim(),
            type: String(cert?.type || "").trim(),
          }))
        : [],
      passport: Array.isArray(safe?.documents?.passport)
        ? safe.documents.passport.map((p) => String(p || ""))
        : [],
      noLanguageCertificate: Boolean(safe?.documents?.noLanguageCertificate),
    },
    commentar: commentHtml,
  };
}
