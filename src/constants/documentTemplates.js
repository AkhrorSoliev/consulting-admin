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
];






