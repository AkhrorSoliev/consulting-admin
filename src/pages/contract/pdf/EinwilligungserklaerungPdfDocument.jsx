import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered } from "./einwilligungserklaerung/styles";
import EinwilligungserklaerungPage from "./einwilligungserklaerung/EinwilligungserklaerungPage";

export default function EinwilligungserklaerungPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <EinwilligungserklaerungPage form={form} />
    </Document>
  );
}
