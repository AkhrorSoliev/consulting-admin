import { pdf } from "@react-pdf/renderer";
import { todayDdMmYyyy } from "../../utils";
import MitarbeiterwohnungPdfDocument from "../../../contract/pdf/MitarbeiterwohnungPdfDocument";
import SprachsbestaetigungPdfDocument from "../../../contract/pdf/SprachsbestaetigungPdfDocument";
import EinwilligungserklaerungPdfDocument from "../../../contract/pdf/EinwilligungserklaerungPdfDocument";
import FotoVideoRozilikPdfDocument from "../../../contract/pdf/FotoVideoRozilikPdfDocument";
import { makeSafeFileName, uploadPdfBlob, loadTemplateForm } from "./helpers";

export async function generateAndUploadMitarbeiterwohnung(formCv) {
  const savedForm = await loadTemplateForm("mitarbeiterwohnung");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const kandidatName = [lastName, firstName].filter(Boolean).join(" ");

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    datum: date,
    kandidatName: kandidatName,
  };

  const fileBase = kandidatName
    ? `Mitarbeiterwohnung ${kandidatName}`
    : "Mitarbeiterwohnung";
  const safeFileName = makeSafeFileName(fileBase, "Mitarbeiterwohnung");

  const blob = await pdf(
    <MitarbeiterwohnungPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadSprachsbestaetigung(formCv) {
  const savedForm = await loadTemplateForm("sprachsbestaetigung");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const kandidatName = [lastName, firstName].filter(Boolean).join(" ");

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    datum: date,
    kandidatName: kandidatName,
  };

  const fileBase = kandidatName
    ? `Sprachsbestaetigung ${kandidatName}`
    : "Sprachsbestaetigung";
  const safeFileName = makeSafeFileName(fileBase, "Sprachsbestaetigung");

  const blob = await pdf(
    <SprachsbestaetigungPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadEinwilligungserklaerung(formCv) {
  const savedForm = await loadTemplateForm("einwilligungserklaerung");

  const vorname = String(formCv?.personalInfo?.name || "").trim();
  const nachname = String(formCv?.personalInfo?.lastName || "").trim();
  const geburtsort = String(formCv?.personalInfo?.birthPlace || "").trim();
  const gender = String(formCv?.personalInfo?.gender || "")
    .trim()
    .toLowerCase();
  const anpirede = gender === "male" ? "Herr" : "Frau";

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    datum: date,
    vorname: vorname,
    nachname: nachname,
    geburtsort: geburtsort,
    anpirede: anpirede,
  };

  const fullName = [nachname, vorname].filter(Boolean).join(" ");
  const fileBase = fullName
    ? `Einwilligungserklaerung ${fullName}`
    : "Einwilligungserklaerung";
  const safeFileName = makeSafeFileName(fileBase, "Einwilligungserklaerung");

  const blob = await pdf(
    <EinwilligungserklaerungPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadFotoVideoRozilik(formCv) {
  const savedForm = await loadTemplateForm("foto_video_rozilik");

  const vorname = String(formCv?.personalInfo?.name || "").trim();
  const nachname = String(formCv?.personalInfo?.lastName || "").trim();
  const fullName = [nachname, vorname].filter(Boolean).join(" ");
  const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
  const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
  const address = String(formCv?.personalInfo?.address || "").trim();

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    fullName: fullName,
    geburtsdatum: birthDate,
    adresse: address,
    geburtsort: birthPlace,
    datum: date,
  };

  const fileBase = fullName
    ? `Foto-Video-Rozilik ${fullName}`
    : "Foto-Video-Rozilik";
  const safeFileName = makeSafeFileName(fileBase, "Foto-Video-Rozilik");

  const blob = await pdf(
    <FotoVideoRozilikPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}
