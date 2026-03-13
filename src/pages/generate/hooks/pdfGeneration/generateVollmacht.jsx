import { pdf } from "@react-pdf/renderer";
import { getDocumentDataById, uploadFileToFirebase } from "../../../../utils";
import { todayDdMmYyyy } from "../../utils/dateUtils";
import VollmachtPdfDocument from "../../../contract/pdf/VollmachtPdfDocument";
import VollmachtArbeitgeberPdfDocument from "../../../contract/pdf/VollmachtArbeitgeberPdfDocument";

export function buildGenerateAndUploadVollmacht(formCv, addressFields) {
  return async () => {
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht"
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const city = String(addressFields?.city || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      firstName,
      lastName,
      birthDate,
      city,
      date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Vollmacht";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht";

    const blob = await pdf(<VollmachtPdfDocument form={merged} />).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  };
}

export function buildGenerateAndUploadVollmachtArbeitgeber(formCv, addressFields) {
  return async () => {
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht_arbeitgeber"
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const phone = String(formCv?.personalInfo?.phone || "").trim();
    const email = String(formCv?.personalInfo?.email || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateBirthDate: birthDate,
      candidateBirthPlace: birthPlace,
      candidateStreet: addressFields?.street || "",
      candidateHouseNumber: addressFields?.houseNumber || "",
      candidatePostalCode: addressFields?.postalCode || "",
      candidateCity: addressFields?.city || "",
      candidateCountry: addressFields?.country || "",
      candidatePhone: phone,
      candidateEmail: email,
      candidatePlaceDate: date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht an Arbeitgeber ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vollmacht an Arbeitgeber";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Vollmacht an Arbeitgeber";

    const blob = await pdf(
      <VollmachtArbeitgeberPdfDocument form={merged} />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  };
}
