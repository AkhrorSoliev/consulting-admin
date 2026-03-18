import { pdf } from "@react-pdf/renderer";
import { getDocumentDataById, uploadFileToFirebase } from "../../../../utils";
import { todayDdMmYyyy } from "../../utils/dateUtils";
import { parseGermanAddress } from "../../utils/addressUtils";
import { fetchUrlAsImageDataUrlBestEffort } from "../../utils/fetchImageUtils";
import { buildProxyAssetUrl } from "../../utils/proxyUtils";
import BeratungsvertragPdfDocument from "../../../contract/pdf/BeratungsvertragPdfDocument";

export function buildGenerateAndUploadBeratungsvertrag(formCv, addressFields) {
  return async (options = {}) => {
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
      contractDate: todayDdMmYyyy(),
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
}
