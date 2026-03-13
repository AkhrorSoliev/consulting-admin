import { pdf } from "@react-pdf/renderer";
import { todayDdMmYyyy, parseGermanAddress } from "../../utils";
import { generateMotivationLetterText } from "../../../../utils/motivationLetter";
import PersonalfragebogenPdfDocument from "../../../contract/pdf/PersonalfragebogenPdfDocument";
import MotivationLetterPdfDocument from "../../pdf/MotivationLetterPdfDocument";
import { makeSafeFileName, uploadPdfBlob, loadTemplateForm } from "./helpers";

export async function generateAndUploadPersonalfragebogen(formCv, docCv) {
  const savedForm = await loadTemplateForm("personalfragebogen");

  const vorname = String(formCv?.personalInfo?.name || "").trim();
  const nachname = String(formCv?.personalInfo?.lastName || "").trim();
  const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
  const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
  const address = String(formCv?.personalInfo?.address || "").trim();
  const geschlecht = String(
    docCv?.persoenlicheDaten?.geschlecht || "",
  ).trim();

  const firstJobOrt = String(docCv?.berufserfahrung?.[0]?.ort || "").trim();
  const ortParts = firstJobOrt.split(",");
  const countryFromOrt =
    ortParts.length > 1 ? ortParts[ortParts.length - 1].trim() : "";
  const staatsangehoerigkeit = countryFromOrt || "usbekisch";

  const date = todayDdMmYyyy();

  const merged = {
    ...savedForm,
    nachname: nachname,
    vorname: vorname,
    wohnadresseUsbekistan: address,
    geburtsdatum: birthDate,
    geburtsort: birthPlace,
    geschlecht: geschlecht,
    staatsangehoerigkeit: staatsangehoerigkeit,
    datum: date,
  };

  const fullName = [nachname, vorname].filter(Boolean).join(" ");
  const fileBase = fullName
    ? `Personalfragebogen ${fullName}`
    : "Personalfragebogen";
  const safeFileName = makeSafeFileName(fileBase, "Personalfragebogen");

  const blob = await pdf(
    <PersonalfragebogenPdfDocument form={merged} />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}

export async function generateAndUploadMotivationLetter(
  formCv,
  addressFields,
) {
  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const city =
    String(addressFields?.city || "").trim() ||
    String(
      parseGermanAddress(String(formCv?.personalInfo?.address || ""))?.city ||
        "",
    ).trim();
  const date = todayDdMmYyyy();

  const letterText = await generateMotivationLetterText({
    personalInfo: formCv?.personalInfo || {},
    education: Array.isArray(formCv?.education) ? formCv.education : [],
    experience: Array.isArray(formCv?.experience) ? formCv.experience : [],
    skills:
      formCv?.skills && typeof formCv.skills === "object"
        ? formCv.skills
        : {},
  });

  const safeFullName = fullName || "Bewerber";
  const fileBase = `Motivationsschreiben ${safeFullName}`;
  const safeFileName = makeSafeFileName(fileBase, "Motivationsschreiben");

  const blob = await pdf(
    <MotivationLetterPdfDocument
      fullName={safeFullName}
      city={city}
      date={date}
      letterText={letterText}
    />,
  ).toBlob();

  return uploadPdfBlob(blob, safeFileName);
}
