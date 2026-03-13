import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered } from "./mitarbeiterwohnung/styles";
import MitarbeiterwohnungPage from "./mitarbeiterwohnung/MitarbeiterwohnungPage";

export default function MitarbeiterwohnungPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <MitarbeiterwohnungPage form={form} />
    </Document>
  );
}
