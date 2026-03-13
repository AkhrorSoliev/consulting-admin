import { pdf } from "@react-pdf/renderer";
import { sortTimelineItemsDesc } from "../../../../utils";
import { todayDdMmYyyy } from "../../utils";
import RozilikXatiPdfDocument from "../../../contract/pdf/RozilikXatiPdfDocument";
import NomzodRozilikXatiPdfDocument from "../../../contract/pdf/NomzodRozilikXatiPdfDocument";
import { makeSafeFileName, uploadPdfBlob, loadTemplateForm } from "./helpers";

export async function generateAndUploadRozilikXati(formCv) {
  const savedForm = await loadTemplateForm("rozilik_xati");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const gender = String(formCv?.personalInfo?.gender || "").trim();
  const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
  const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
  const phone = String(formCv?.personalInfo?.phone || "").trim();
  const address = String(formCv?.personalInfo?.address || "").trim();

  let oqishJoyi = "";
  const educationList = Array.isArray(formCv?.education)
    ? formCv.education
    : [];
  if (educationList.length > 0) {
    const sorted = sortTimelineItemsDesc([...educationList]);
    const last = sorted[0];
    oqishJoyi = String(last?.school || last?.institution || "").trim();
  }

  let jinsi = "";
  if (gender) {
    const g = gender.toLowerCase();
    if (g === "male" || g === "männlich" || g === "erkak") {
      jinsi = "Erkak";
    } else if (g === "female" || g === "weiblich" || g === "ayol") {
      jinsi = "Ayol";
    } else {
      jinsi = gender;
    }
  }

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    nomzodIsm: firstName,
    nomzodFamilya: lastName,
    nomzodJinsi: jinsi,
    nomzodTugilganSana: birthDate,
    nomzodManzil: address,
    nomzodOqishJoyi: oqishJoyi,
    nomzodTelefon: phone,
    joy: birthPlace,
    sana: date,
  };

  const fileBase =
    firstName || lastName
      ? `Rozilik xati ${[firstName, lastName].filter(Boolean).join(" ")}`
      : "Rozilik xati";
  const safeFileName = makeSafeFileName(fileBase, "Rozilik xati");

  const blob = await pdf(<RozilikXatiPdfDocument form={merged} />).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadNomzodRozilikXati(formCv) {
  const savedForm = await loadTemplateForm("nomzod_rozilik_xati");

  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const nomzodIsmFamilya = [firstName, lastName].filter(Boolean).join(" ");

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    sana: date,
    nomzodIsmFamilya: nomzodIsmFamilya,
  };

  const fileBase = nomzodIsmFamilya
    ? `Nomzod rozilik xati ${nomzodIsmFamilya}`
    : "Nomzod rozilik xati";
  const safeFileName = makeSafeFileName(fileBase, "Nomzod rozilik xati");

  const blob = await pdf(
    <NomzodRozilikXatiPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}
