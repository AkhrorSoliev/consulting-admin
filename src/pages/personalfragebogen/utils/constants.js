import { todayDdMmYyyy } from "./dateHelpers";

export const TEMPLATE_COLLECTION = "template_documents";
export const TEMPLATE_ID = "personalfragebogen";

export const INITIAL_FORM_STATE = {
  nachname: "",
  vorname: "",
  wohnadresseDeutschland: "",
  wohnadresseUsbekistan: "",
  geburtsdatum: "",
  geburtsort: "",
  geschlecht: "",
  staatsangehoerigkeit: "usbekisch",
  schuhgroesse: "",
  kleidergroesse: "",
  steueridentifikationsnummer: "",
  krankenversicherung: "",
  bankName: "",
  iban: "",
  bic: "",
  visaArt: "",
  visaNummer: "",
  visaGueltigkeit: "",
  datum: todayDdMmYyyy(),
};

export const LAYOUT_CLASS =
  "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

export const FORM_CARD_CLASS =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";
