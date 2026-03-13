export function isEducationEntryFilled(edu) {
  const hasStart = Boolean((edu?.startDate || "").trim());
  const hasEnd =
    edu?.endDate === "bis heute" || Boolean((edu?.endDate || "").trim());
  const hasInstitution = Boolean((edu?.institution || "").trim());
  const hasDegree = Boolean((edu?.degree || "").trim());
  return hasStart && hasEnd && hasInstitution && hasDegree;
}

export function isEducationEntryEmpty(edu) {
  const hasStart = Boolean((edu?.startDate || "").trim());
  const hasEnd =
    edu?.endDate === "bis heute" || Boolean((edu?.endDate || "").trim());
  const hasInstitution = Boolean((edu?.institution || "").trim());
  const hasDegree = Boolean((edu?.degree || "").trim());
  return !hasStart && !hasEnd && !hasInstitution && !hasDegree;
}

export function isExperienceEntryFilled(exp) {
  const hasStart = Boolean((exp?.startDate || "").trim());
  const hasEnd =
    exp?.endDate === "bis heute" || Boolean((exp?.endDate || "").trim());
  const hasPosition = Boolean((exp?.position || "").trim());
  const hasCompany = Boolean((exp?.company || "").trim());
  const hasLocation = Boolean((exp?.location || "").trim());
  const hasResponsibilities =
    Array.isArray(exp?.responsibilities) && exp.responsibilities.length > 0;
  return (
    hasStart &&
    hasEnd &&
    hasPosition &&
    hasCompany &&
    hasLocation &&
    hasResponsibilities
  );
}

export function isExperienceEntryEmpty(exp) {
  const hasStart = Boolean((exp?.startDate || "").trim());
  const hasEnd =
    exp?.endDate === "bis heute" || Boolean((exp?.endDate || "").trim());
  const hasPosition = Boolean((exp?.position || "").trim());
  const hasCompany = Boolean((exp?.company || "").trim());
  const hasLocation = Boolean((exp?.location || "").trim());
  const hasResponsibilities =
    Array.isArray(exp?.responsibilities) && exp.responsibilities.length > 0;
  return (
    !hasStart &&
    !hasEnd &&
    !hasPosition &&
    !hasCompany &&
    !hasLocation &&
    !hasResponsibilities
  );
}

export function getEducationErrors(education) {
  if (!education) return {};
  return {
    schule: {
      startDate: !(education.schule?.startDate || "").trim(),
      endDate: !(
        education.schule?.endDate === "bis heute" ||
        (education.schule?.endDate || "").trim()
      ),
      institution: !(education.schule?.institution || "").trim(),
      degree: !(education.schule?.degree || "").trim(),
    },
  };
}

export function getExperienceErrors(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((exp) => ({
    startDate: !(exp?.startDate || "").trim(),
    endDate: !(exp?.endDate === "bis heute" || (exp?.endDate || "").trim()),
    position: !(exp?.position || "").trim(),
    company: !(exp?.company || "").trim(),
    location: !(exp?.location || "").trim(),
  }));
}

export function isLanguageEntryFilled(row) {
  const hasName = Boolean((row?.name || "").trim());
  const hasLevel = Boolean((row?.level || "").trim());
  return hasName && hasLevel;
}

export function getLanguageErrors(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((row) => ({
    name: !(row?.name || "").trim(),
    level: !(row?.level || "").trim(),
  }));
}
