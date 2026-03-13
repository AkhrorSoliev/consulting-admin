import {
  getDocumentDataById,
  uploadFileToFirebase,
} from "../../../../utils";

export function makeSafeFileName(base, fallback) {
  return base.replace(/[\\/:*?"<>|]/g, "").trim() || fallback;
}

export async function uploadPdfBlob(blob, fileName) {
  const file = new File([blob], `ConsultingUz ${fileName}.pdf`, {
    type: "application/pdf",
  });
  const url = await uploadFileToFirebase(file, "outgoing");
  return { url, fileName: `ConsultingUz ${fileName}.pdf` };
}

export async function loadTemplateForm(templateId) {
  const templateDoc = await getDocumentDataById(
    "template_documents",
    templateId,
  );
  if (
    templateDoc &&
    typeof templateDoc === "object" &&
    templateDoc.form &&
    typeof templateDoc.form === "object"
  ) {
    return templateDoc.form;
  }
  return {};
}
