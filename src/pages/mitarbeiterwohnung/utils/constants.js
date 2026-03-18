import { todayDdMmYyyy } from "./dateHelpers";

export const TEMPLATE_COLLECTION = "template_documents";
export const TEMPLATE_ID = "mitarbeiterwohnung";

export const initialFormState = {
  // Company info (header)
  firmaName: "Erlebnispark Tripsdrill GmbH & Co.KG",
  abteilung: "Human Resources",
  kontaktPerson: "Nupel Kara",
  strasse: "Erlebnispark-Tripsdrill-Straße 1",
  plz: "74389",
  ort: "Cleebronn",
  telefon: "",
  email: "",
  // Candidate info
  kandidatName: "",
  datum: todayDdMmYyyy(),
  // Content
  praktikumsart: "Weiterbildungspraktikums",
  grussOrt: "Tripsdrill",
};

export const layoutClass =
  "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

export const formCardClass =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";
