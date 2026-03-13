import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered } from "./vollmacht/styles";
import VollmachtPage from "./vollmacht/VollmachtPage";

export default function VollmachtPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <VollmachtPage form={form} />
    </Document>
  );
}
