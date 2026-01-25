// Central registry for document templates used across the app.
// Add new templates here so they appear automatically in:
// - Settings → Documents
// - Generate → Candidate outgoing documents
export const DOCUMENT_TEMPLATES = [
  {
    id: "beratungsvertrag",
    title: "Beratungsvertrag",
    description:
      "Template: Vertrag ausfüllen, Live‑Preview & PDF herunterladen.",
    to: "/settings/documents/beratungsvertrag",
    kind: "pdf",
  },
  {
    id: "vermittlungsvertrag",
    title: "Vermittlungsvertrag",
    description:
      "Template: Vermittlungsvertrag ausfüllen, Live‑Preview & PDF herunterladen.",
    to: "/settings/documents/vermittlungsvertrag",
    kind: "pdf",
  },
  {
    id: "vollmacht",
    title: "Vollmacht",
    description:
      "Template: Vollmacht ausfüllen, Live‑Preview & PDF herunterladen.",
    to: "/settings/documents/vollmacht",
    kind: "pdf",
  },
  {
    id: "vollmacht_arbeitgeber",
    title: "Vollmacht an Arbeitgeber",
    description:
      "Template: Vollmacht nach § 81a Abs. 1 AufenthG für beschleunigtes Fachkräfteverfahren.",
    to: "/settings/documents/vollmacht-arbeitgeber",
    kind: "pdf",
  },
  {
    id: "rozilik_xati",
    title: "Rozilik xati (ota-ona)",
    description:
      "Template: Germaniyaga borishga va ta'til vaqtida yordamchi ishlarda ishlashga rozilik xati.",
    to: "/settings/documents/rozilik-xati",
    kind: "pdf",
  },
  {
    id: "nomzod_rozilik_xati",
    title: "Nomzod rozilik xati",
    description:
      "Template: Nomzodning o'zi yozadigan rozilik xati - ish beruvchi va ConsultingUz ga.",
    to: "/settings/documents/nomzod-rozilik-xati",
    kind: "pdf",
  },
  {
    id: "mitarbeiterwohnung",
    title: "Mitarbeiterwohnung Bestätigung",
    description:
      "Template: Bestätigung über die Bereitstellung einer Mitarbeiterwohnung.",
    to: "/settings/documents/mitarbeiterwohnung",
    kind: "pdf",
  },
  {
    id: "sprachsbestaetigung",
    title: "Sprachsbestätigung (Deutschkenntnisse)",
    description:
      "Template: Bestätigung der Deutschkenntnisse nach Online-Vorstellungsgespräch.",
    to: "/settings/documents/sprachsbestaetigung",
    kind: "pdf",
  },
  {
    id: "einwilligungserklaerung",
    title: "Einwilligungserklärung DSGVO",
    description:
      "Template: Einwilligungserklärung gemäß DSGVO in die Verarbeitung von Daten.",
    to: "/settings/documents/einwilligungserklaerung",
    kind: "pdf",
  },
  {
    id: "foto_video_rozilik",
    title: "Foto/Video Rozilik",
    description:
      "Template: Foto va video tasvirlardan foydalanishga rozilik arizasi (Nemis va O'zbek tilida).",
    to: "/settings/documents/foto-video-rozilik",
    kind: "pdf",
  },
  {
    id: "personalfragebogen",
    title: "Personalfragebogen",
    description:
      "Template: Ishchi haqidagi ma'lumotnoma - shaxsiy ma'lumotlar, soliq, bank, viza.",
    to: "/settings/documents/personalfragebogen",
    kind: "pdf",
  },
  {
    id: "erklaerung_beschaeftigung",
    title: "Erklärung zum Beschäftigungsverhältnis",
    description:
      "Template: Fillable PDF - Germaniya mehnat agentligi uchun ish beruvchi deklaratsiyasi.",
    to: "/settings/documents/erklaerung-beschaeftigung",
    kind: "fillable-pdf",
    disabled: true,
  },
  {
    id: "zusatzblatt_a",
    title: "Zusatzblatt A - Anerkennungsverfahren",
    description:
      "Template: Fillable PDF - Beschäftigung im Rahmen des Anerkennungsverfahrens.",
    to: "/settings/documents/zusatzblatt-a",
    kind: "fillable-pdf",
  },
  {
    id: "zusatzblatt_b",
    title: "Zusatzblatt B - ICT / Personalaustausch",
    description:
      "Template: Fillable PDF - Unternehmensintern transferierte Arbeitnehmer (ICT).",
    to: "/settings/documents/zusatzblatt-b",
    kind: "fillable-pdf",
  },
  {
    id: "zusatzblatt_c",
    title: "Zusatzblatt C - Berufskraftfahrer",
    description:
      "Template: Fillable PDF - Beschäftigung als Berufskraftfahrer/in.",
    to: "/settings/documents/zusatzblatt-c",
    kind: "fillable-pdf",
  },
  {
    id: "zusatzblatt_d",
    title: "Zusatzblatt D - Kurzfristige Beschäftigung",
    description:
      "Template: Fillable PDF - Kurzfristige Beschäftigung (90 Tage / 8 Monate).",
    to: "/settings/documents/zusatzblatt-d",
    kind: "fillable-pdf",
  },
  {
    id: "beschaeftigungsverhaeltnis",
    title: "Beschäftigungsverhältnis (Yangi)",
    description:
      "Template: Fillable PDF - Yangi versiya Erklärung zum Beschäftigungsverhältnis.",
    to: "/settings/documents/beschaeftigungsverhaeltnis",
    kind: "fillable-pdf",
    disabled: true,
  },
];






