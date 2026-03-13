const PDF_BACKEND_URL =
  import.meta.env.VITE_PDF_BACKEND_URL ||
  "https://unsincerely-monarchal-alva.ngrok-free.dev";
const TEMPLATE_NAME = "erklaerung-zum-beschaeftigungsverhaeltnis.pdf";
const DEFAULTS_KEY = "erklaerung_beschaeftigung";

const ERKLAERUNG_OPTIONS = [
  {
    value:
      "zur Erteilung eines Aufenthaltstitels zum Zweck der Beschaeftigung",
    label:
      "zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung",
  },
  {
    value:
      "zur Zustimmung der Aufnahme einer Beschaeftigung von Personen mit Duldung oder Aufenthaltsgestattung",
    label:
      "zur Zustimmung der Aufnahme einer Beschäftigung (Duldung/Aufenthaltsgestattung)",
  },
  {
    value:
      "zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschaeftigung nicht erlaubt",
    label:
      "zur Zustimmung zu einer Aufenthaltserlaubnis (Beschäftigung nicht erlaubt)",
  },
  {
    value:
      "zur Erteilung einer Vorabzustimmung der Bundesagentur fuer Arbeit",
    label:
      "zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit",
  },
  {
    value:
      "zur Erteilung einer Arbeitserlaubnis der Bundesagentur fuer Arbeit",
    label:
      "zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit",
  },
];

const ANLASS_OPTIONS = [
  { value: "Ersterteilung", label: "Ersterteilung" },
  { value: "Verlaengerung", label: "Verlängerung" },
  { value: "Arbeitgeberwechsel", label: "Arbeitgeberwechsel" },
];

const GESCHLECHT_OPTIONS = [
  { value: "maennlich", label: "männlich" },
  { value: "weiblich", label: "weiblich" },
  { value: "divers", label: "divers" },
];

const JA_NEIN = [
  { value: "ja", label: "Ja" },
  { value: "nein", label: "Nein" },
];

const ARBEITSORT_OPTIONS = [
  {
    value: "Arbeitsort entspricht dem Arbeitgeber-Sitz",
    label: "Entspricht dem Arbeitgeber-Sitz",
  },
  {
    value:
      "Arbeitnehmerin oder Arbeitnehmer wird an wechselnden Arbeits-/Einsatzorten beschaeftigt",
    label: "Wechselnde Arbeits-/Einsatzorte",
  },
  {
    value: "Der Arbeitsort befindet sich unter folgender Adresse",
    label: "Andere Adresse",
  },
];

const ARBEITSZEIT_OPTIONS = [
  { value: "Vollzeit", label: "Vollzeit" },
  { value: "Teilzeit", label: "Teilzeit" },
  { value: "Geringfuegige Beschaeftigung", label: "Geringfügige Beschäftigung" },
];

const AUSLAND_OPTIONS = [
  { value: "ja - bitte Nachweis vorlegen", label: "Ja (Nachweis vorlegen)" },
  { value: "nein", label: "Nein" },
];

const AUSLAND_TEILWEISE_OPTIONS = [
  { value: "ja - bitte Nachweis vorlegen", label: "Ja (Nachweis vorlegen)" },
  { value: "nein", label: "Nein" },
  {
    value: "teilweise - bitte Nachweis vorlegen",
    label: "Teilweise (Nachweis vorlegen)",
  },
];

export {
  PDF_BACKEND_URL,
  TEMPLATE_NAME,
  DEFAULTS_KEY,
  ERKLAERUNG_OPTIONS,
  ANLASS_OPTIONS,
  GESCHLECHT_OPTIONS,
  JA_NEIN,
  ARBEITSORT_OPTIONS,
  ARBEITSZEIT_OPTIONS,
  AUSLAND_OPTIONS,
  AUSLAND_TEILWEISE_OPTIONS,
};
