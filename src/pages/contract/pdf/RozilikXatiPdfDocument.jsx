import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered } from "./rozilikXati/styles";
import RozilikXatiPage from "./rozilikXati/RozilikXatiPage";

export default function RozilikXatiPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <RozilikXatiPage form={form} />
    </Document>
  );
}
