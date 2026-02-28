import { pdf } from "@react-pdf/renderer";
import { getDocumentDataById, uploadFileToFirebase } from "../../../utils";
import { todayDdMmYyyy } from "../utils/dateUtils";
import { parseGermanAddress } from "../utils/addressUtils";
import { fetchUrlAsImageDataUrlBestEffort } from "../utils/fetchImageUtils";
import { buildProxyAssetUrl } from "../utils/proxyUtils";
import BeratungsvertragPdfDocument from "../../contract/pdf/BeratungsvertragPdfDocument";
import VermittlungsvertragPdfDocument from "../../contract/pdf/VermittlungsvertragPdfDocument";
import VollmachtPdfDocument from "../../contract/pdf/VollmachtPdfDocument";
import VollmachtArbeitgeberPdfDocument from "../../contract/pdf/VollmachtArbeitgeberPdfDocument";

export function usePdfGeneration(formCv, addressFields) {
  const generateAndUploadBeratungsvertrag = async (options = {}) => {
    const omitPassportPage = Boolean(options?.omitPassportPage);

    const templateDoc = await getDocumentDataById(
      "template_documents",
      "beratungsvertrag"
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
    const city =
      String(addressFields?.city || "").trim() ||
      String(
        parseGermanAddress(formCv?.personalInfo?.address || "")?.city || ""
      ).trim();

    const baseForm = {
      firstName: "",
      lastName: "",
      contractDate: todayDdMmYyyy(),
      candidateCity: "",
      pdfGeneratedDate: todayDdMmYyyy(),
      feeTotalEur: "1200",
      feeAdvanceEur: "250",
      signatureCity: "",
      pdfUrl: "",
    };

    const merged = {
      ...baseForm,
      ...(savedForm ? savedForm : {}),
      firstName,
      lastName,
      candidateCity: city,
      signatureCity: city,
      pdfGeneratedDate: todayDdMmYyyy(),
    };

    const passportUrls = Array.isArray(formCv?.documents?.passport)
      ? formCv.documents.passport
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    const diplomaUrls = Array.isArray(formCv?.documents?.diplomas)
      ? formCv.documents.diplomas
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    const docUrls = omitPassportPage
      ? []
      : Array.from(
          new Set([
            ...(passportUrls.length ? passportUrls : []),
            ...(!passportUrls.length ? diplomaUrls : []),
          ])
        );
    let passportSrc = "";
    let usedPassportUrl = "";
    for (const u of docUrls) {
      // eslint-disable-next-line no-await-in-loop
      const extracted = await fetchUrlAsImageDataUrlBestEffort(u);
      if (extracted) {
        passportSrc = extracted;
        usedPassportUrl = u;
        break;
      }
      const looksImage = /\.(png|jpe?g|webp)$/i.test(u);
      if (looksImage) {
        passportSrc = buildProxyAssetUrl(u) || u;
        usedPassportUrl = u;
        break;
      }
    }
    if (!passportSrc && docUrls.length) {
    }

    const fileBase =
      firstName || lastName
        ? `Beratungsvertrag ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Beratungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Beratungsvertrag";

    const blob = await pdf(
      <BeratungsvertragPdfDocument
        form={merged}
        passportImageDataUrl={passportSrc || null}
      />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  };

  const generateAndUploadVermittlungsvertrag = async () => {
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

  const generateAndUploadVollmacht = async () => {
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

  const generateAndUploadVollmachtArbeitgeber = async () => {
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

  return {
    generateAndUploadBeratungsvertrag,
    generateAndUploadVermittlungsvertrag,
    generateAndUploadVollmacht,
    generateAndUploadVollmachtArbeitgeber,
  };
}
