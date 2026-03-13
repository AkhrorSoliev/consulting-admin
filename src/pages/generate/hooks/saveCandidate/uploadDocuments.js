import { uploadFileToFirebase } from "../../../../utils";

/**
 * Uploads pending document files to Firebase Storage and returns URL mappings.
 *
 * @param {Object} params
 * @param {Object} params.pendingDocumentFiles - Pending files by document type
 * @param {boolean} params.isLimitedAdmin - Whether user is a limited admin
 * @param {Function} params.setPendingDocumentFiles - State setter to clear pending files
 * @returns {Promise<Object>} Map of tempUrl -> realUrl replacements
 */
export async function uploadPendingDocuments({
  pendingDocumentFiles,
  isLimitedAdmin,
  setPendingDocumentFiles,
}) {
  const hasPendingFiles =
    pendingDocumentFiles.passport.length > 0 ||
    pendingDocumentFiles.diplomas.length > 0 ||
    pendingDocumentFiles.certificates.length > 0;

  const urlReplacements = {};

  if (!hasPendingFiles || isLimitedAdmin) {
    return urlReplacements;
  }

  const folderMap = {
    passport: "passports",
    diplomas: "diplomas",
    certificates: "certificates",
  };

  for (const docType of ["passport", "diplomas", "certificates"]) {
    const pendingFiles = pendingDocumentFiles[docType] || [];
    if (pendingFiles.length === 0) continue;

    for (const { file, tempUrl } of pendingFiles) {
      const realUrl = await uploadFileToFirebase(file, folderMap[docType]);
      urlReplacements[tempUrl] = realUrl;
      URL.revokeObjectURL(tempUrl);
    }
  }

  // Clear pending files
  setPendingDocumentFiles({
    passport: [],
    diplomas: [],
    certificates: [],
  });

  return urlReplacements;
}

/**
 * Creates a copy of formCv with temporary blob URLs replaced by real Firebase URLs.
 *
 * @param {Object} formCv - The form state
 * @param {Object} urlReplacements - Map of tempUrl -> realUrl
 * @returns {Object} Updated formCv with real URLs
 */
export function replaceDocumentUrls(formCv, urlReplacements) {
  const replaceUrl = (url) => urlReplacements[url] || url;

  return {
    ...formCv,
    documents: {
      ...formCv.documents,
      passport: Array.isArray(formCv.documents?.passport)
        ? formCv.documents.passport.map(replaceUrl)
        : [],
      diplomas: Array.isArray(formCv.documents?.diplomas)
        ? formCv.documents.diplomas.map(replaceUrl)
        : [],
      certificates: Array.isArray(formCv.documents?.certificates)
        ? formCv.documents.certificates.map(replaceUrl)
        : [],
      certificatesDetailed: Array.isArray(
        formCv.documents?.certificatesDetailed,
      )
        ? formCv.documents.certificatesDetailed.map((cert) => ({
            ...cert,
            url: replaceUrl(cert.url),
          }))
        : [],
    },
  };
}
