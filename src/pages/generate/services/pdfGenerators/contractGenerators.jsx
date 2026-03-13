import { pdf } from "@react-pdf/renderer";
import {
  todayDdMmYyyy,
  parseGermanAddress,
  fetchUrlAsImageDataUrlBestEffort,
  buildProxyAssetUrl,
} from "../../utils";
import BeratungsvertragPdfDocument from "../../../contract/pdf/BeratungsvertragPdfDocument";
import VermittlungsvertragPdfDocument from "../../../contract/pdf/VermittlungsvertragPdfDocument";
import { makeSafeFileName, uploadPdfBlob, loadTemplateForm } from "./helpers";

export async function generateAndUploadBeratungsvertrag(
  formCv,
  addressFields,
  options = {},
) {
  const omitPassportPage = Boolean(options?.omitPassportPage);
  const savedForm = await loadTemplateForm("beratungsvertrag");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const city =
    String(addressFields?.city || "").trim() ||
    String(
      parseGermanAddress(formCv?.personalInfo?.address || "")?.city || "",
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
        ]),
      );
  let passportSrc = "";
  for (const u of docUrls) {
    // eslint-disable-next-line no-await-in-loop
    const extracted = await fetchUrlAsImageDataUrlBestEffort(u);
    if (extracted) {
      passportSrc = extracted;
      break;
    }
    const looksImage = /\.(png|jpe?g|webp)$/i.test(u);
    if (looksImage) {
      passportSrc = buildProxyAssetUrl(u) || u;
      break;
    }
  }

  const fileBase =
    firstName || lastName
      ? `Beratungsvertrag ${[firstName, lastName].filter(Boolean).join(" ")}`
      : "Beratungsvertrag";
  const safeFileName = makeSafeFileName(fileBase, "Beratungsvertrag");

  const blob = await pdf(
    <BeratungsvertragPdfDocument
      form={merged}
      passportImageDataUrl={passportSrc || null}
    />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadVermittlungsvertrag(
  formCv,
  addressFields,
) {
  const savedForm = await loadTemplateForm("vermittlungsvertrag");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const city = String(addressFields?.city || "").trim();
  const country = String(addressFields?.country || "").trim();
  const templateSignatureCity = String(
    savedForm?.signatureCity || savedForm?.candidateCity || "",
  ).trim();
  const templateSignatureDate = String(
    savedForm?.signatureDate || savedForm?.pdfGeneratedDate || "",
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
  const safeFileName = makeSafeFileName(fileBase, "Vermittlungsvertrag");

  const blob = await pdf(
    <VermittlungsvertragPdfDocument
      form={formCv}
      templateForm={signatureTemplate}
    />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}
