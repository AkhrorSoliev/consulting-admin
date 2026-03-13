export const PDF_BACKEND_URL =
  import.meta.env.VITE_PDF_BACKEND_URL ||
  "https://unsincerely-monarchal-alva.ngrok-free.dev";

export const TEMPLATE_NAME = "beschaeftigungsverhaeltnis.pdf";
export const DEFAULTS_KEY = "beschaeftigungsverhaeltnis";

// Multi-widget checkbox options - value is widget index (0, 1, 2, etc.)
export const ERKLAERUNG_OPTIONS = [
  { value: 0, label: "zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung" },
  { value: 1, label: "zur Zustimmung der Aufnahme einer Beschäftigung (Duldung/Aufenthaltsgestattung)" },
  { value: 2, label: "zur Zustimmung zu einer Aufenthaltserlaubnis (Beschäftigung nicht erlaubt)" },
  { value: 3, label: "zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit" },
  { value: 4, label: "zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit" },
];

export const ANLASS_OPTIONS = [
  { value: 0, label: "Ersterteilung" },
  { value: 1, label: "Verlängerung" },
  { value: 2, label: "Arbeitgeberwechsel" },
];

export const GESCHLECHT_OPTIONS = [
  { value: 0, label: "männlich" },
  { value: 1, label: "weiblich" },
  { value: 2, label: "divers" },
];

export const JA_NEIN = [
  { value: 0, label: "Ja" },
  { value: 1, label: "Nein" },
];

export const ARBEITSORT_OPTIONS = [
  { value: 0, label: "Entspricht dem Arbeitgeber-Sitz" },
  { value: 1, label: "Wechselnde Arbeits-/Einsatzorte" },
  { value: 2, label: "Andere Adresse" },
];

export const ARBEITSZEIT_OPTIONS = [
  { value: 0, label: "Vollzeit" },
  { value: 1, label: "Teilzeit" },
  { value: 2, label: "Geringfügige Beschäftigung" },
];

export const AUSLAND_OPTIONS = [
  { value: 0, label: "Ja (Nachweis vorlegen)" },
  { value: 1, label: "Nein" },
];

export const AUSLAND_TEILWEISE_OPTIONS = [
  { value: 0, label: "Ja (Nachweis vorlegen)" },
  { value: 1, label: "Nein" },
  { value: 2, label: "Teilweise (Nachweis vorlegen)" },
];
