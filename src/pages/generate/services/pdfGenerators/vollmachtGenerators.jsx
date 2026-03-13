import { pdf } from "@react-pdf/renderer";
import { todayDdMmYyyy } from "../../utils";
import VollmachtPdfDocument from "../../../contract/pdf/VollmachtPdfDocument";
import VollmachtArbeitgeberPdfDocument from "../../../contract/pdf/VollmachtArbeitgeberPdfDocument";
import { makeSafeFileName, uploadPdfBlob, loadTemplateForm } from "./helpers";

export async function generateAndUploadVollmacht(formCv, addressFields) {
  const savedForm = await loadTemplateForm("vollmacht");

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
    city: city || String(savedForm?.city || "").trim(),
    date,
  };

  const fileBase =
    firstName || lastName
      ? `Vollmacht ${[firstName, lastName].filter(Boolean).join(" ")}`
      : "Vollmacht";
  const safeFileName = makeSafeFileName(fileBase, "Vollmacht");

  const blob = await pdf(<VollmachtPdfDocument form={merged} />).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadVollmachtArbeitgeber(
  formCv,
  addressFields,
) {
  const savedForm = await loadTemplateForm("vollmacht_arbeitgeber");

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
  const safeFileName = makeSafeFileName(fileBase, "Vollmacht an Arbeitgeber");

  const blob = await pdf(
    <VollmachtArbeitgeberPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}
