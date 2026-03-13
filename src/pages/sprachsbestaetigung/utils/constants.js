import { todayDdMmYyyy } from "./dateHelpers";

export const TEMPLATE_COLLECTION = "template_documents";
export const TEMPLATE_ID = "sprachsbestaetigung";

export function getDefaultForm() {
  return {
    // Company info (header)
    firmaName: "Erlebnispark Tripsdrill GmbH & Co.KG",
    abteilung: "Human Resources",
    kontaktPerson: "Nupel Kara",
    strasse: "Erlebnispark-Tripsdrill-Straße 1",
    plz: "74389",
    ort: "Cleebronn",
    telefon: "+49 7135 999 307",
    email: "nupel.kara@tripsdrill.de",
    // Candidate info
    kandidatName: "",
    datum: todayDdMmYyyy(),
    // Content
    praktikumsart: "Weiterbildungspraktikum",
  };
}
