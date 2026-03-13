import { Document, Page, Text } from "@react-pdf/renderer";
import s from "./vollmachtArbeitgeber/styles";
import { ensureArimoRegistered, hasValue } from "./vollmachtArbeitgeber/utils";
import VollmachtTable from "./vollmachtArbeitgeber/VollmachtTable";
import VollmachtTextBody from "./vollmachtArbeitgeber/VollmachtTextBody";
import SignatureSection from "./vollmachtArbeitgeber/SignatureSection";

export default function VollmachtArbeitgeberPdfDocument({ form }) {
  ensureArimoRegistered();

  const employerDisplayName = (() => {
    const designation = form?.employerDesignation;
    if (hasValue(designation)) return designation;
    const companyName = form?.employerCompanyName;
    if (hasValue(companyName)) return companyName;
    return "";
  })();

  const employerRepDisplayName = (() => {
    const full = form?.employerRepFullName;
    if (hasValue(full)) return full;
    const parts = [form?.employerRepFirstName, form?.employerRepLastName]
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return parts.join(" ");
  })();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Vollmacht nach § 81a Abs. 1 AufenthG</Text>

        <VollmachtTable form={form} />

        <VollmachtTextBody
          employerDisplayName={employerDisplayName}
          employerRepDisplayName={employerRepDisplayName}
        />

        <SignatureSection form={form} />
      </Page>
    </Document>
  );
}
