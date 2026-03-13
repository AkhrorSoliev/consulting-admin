import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered } from "./sprachsbestaetigung/styles";
import SprachsbestaetigungPage from "./sprachsbestaetigung/SprachsbestaetigungPage";

export default function SprachsbestaetigungPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <SprachsbestaetigungPage form={form} />
    </Document>
  );
}
