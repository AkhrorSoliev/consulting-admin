import { pdf } from "@react-pdf/renderer";
import { getDocumentDataById, uploadFileToFirebase } from "../../../../utils";
import { todayDdMmYyyy } from "../../utils/dateUtils";
import VermittlungsvertragPdfDocument from "../../../contract/pdf/VermittlungsvertragPdfDocument";

export function buildGenerateAndUploadVermittlungsvertrag(formCv, addressFields) {
  return async () => {
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vermittlungsvertrag"
    );
    const savedForm =
      templateDoc &&
      typeof templateDoc === "object" &&
      templateDoc.form &&
      typeof templateDoc.form === "object"
        ? templateDoc.form
        : null;

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const city = String(addressFields?.city || "").trim();
    const country = String(addressFields?.country || "").trim();
    const templateSignatureCity = String(
      savedForm?.signatureCity || savedForm?.candidateCity || ""
    ).trim();
    const templateSignatureDate = String(
      savedForm?.signatureDate || savedForm?.pdfGeneratedDate || ""
    ).trim();

    const signatureTemplate = {
      ...(savedForm ? savedForm : {}),
      candidateLand: country || String(savedForm?.candidateLand || "").trim(),
      signatureCity: city || templateSignatureCity,
      signatureDate: templateSignatureDate || todayDdMmYyyy(),
    };

    const fileBase =
      firstName || lastName
        ? `Vermittlungsvertrag ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vermittlungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vermittlungsvertrag";

    const blob = await pdf(
      <VermittlungsvertragPdfDocument
        form={formCv}
        templateForm={signatureTemplate}
      />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  };
}
