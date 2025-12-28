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
];






