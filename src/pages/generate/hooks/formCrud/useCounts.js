export function useCounts({ formCv, languageRows }) {
  const experienceCount = Array.isArray(formCv.experience)
    ? formCv.experience.length
    : 0;
  const educationCount = Array.isArray(formCv.education)
    ? formCv.education.length
    : 0;
  const languagesCount = Array.isArray(languageRows) ? languageRows.length : 0;
  const documentsCount =
    (Array.isArray(formCv.documents?.diplomas)
      ? formCv.documents.diplomas.length
      : 0) +
    (Array.isArray(formCv.documents?.certificates)
      ? formCv.documents.certificates.length
      : 0) +
    (Array.isArray(formCv.documents?.passport)
      ? formCv.documents.passport.length
      : 0);

  return { experienceCount, educationCount, languagesCount, documentsCount };
}
