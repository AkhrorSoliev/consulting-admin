import { Document, Page, Text } from "@react-pdf/renderer";
import { s } from "./beratungsvertrag/styles";
import {
  ensureInterRegistered,
  safeDate,
  safeName,
  parseMoneyEur,
  formatEur,
} from "./beratungsvertrag/utils";
import ContractSections1to7 from "./beratungsvertrag/ContractSections1to7";
import ContractSections8to15 from "./beratungsvertrag/ContractSections8to15";
import PassportPage from "./beratungsvertrag/PassportPage";

export default function BeratungsvertragPdfDocument({ form, passportImageDataUrl }) {
  ensureInterRegistered();
  const first = String(form?.firstName || "").trim();
  const last = String(form?.lastName || "").trim();
  const clientFullName = [first, last].filter(Boolean).join(" ").trim();
  const nameLine = safeName(clientFullName);
  const dateLine = safeDate(form?.contractDate);
  const signatureCityLine = String(form?.signatureCity || "").trim() || "_____________________";
  const passportSrc = String(passportImageDataUrl || "").trim();
  const candidateCity = String(form?.candidateCity || "").trim();
  const pdfGeneratedDate = String(form?.pdfGeneratedDate || "").trim();
  const total = parseMoneyEur(form?.feeTotalEur);
  const adv = parseMoneyEur(form?.feeAdvanceEur);
  const rest =
    total != null && adv != null && Number.isFinite(total - adv)
      ? Math.max(0, total - adv)
      : null;
  const totalText = formatEur(total);
  const advText = formatEur(adv);
  const restText = formatEur(rest);

  return (
    <Document>
      {/* Use ONE flowing Page so react-pdf paginates naturally and avoids large blank spaces. */}
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Beratungsvertrag</Text>

        <Text style={s.p}>Zwischen</Text>
        <Text style={[s.p, s.bold]}>{nameLine}</Text>
        <Text style={[s.p, { textAlign: "right" }]}>
          - nachfolgend „Auftraggeber" genannt –
        </Text>
        <Text style={s.p}>und</Text>
        <Text style={[s.p, s.bold]}>ConsultingUz</Text>
        <Text>vertreten durch Orif Akhmadaliev</Text>
        <Text style={[s.p, { textAlign: "right" }]}>
          - nachfolgend „Auftragnehmer" genannt –
        </Text>
        <Text style={s.p}>wird folgender Beratungsvertrag geschlossen:</Text>

        <ContractSections1to7
          nameLine={nameLine}
          totalText={totalText}
          advText={advText}
          restText={restText}
        />

        <ContractSections8to15
          dateLine={dateLine}
          nameLine={nameLine}
          signatureCityLine={signatureCityLine}
        />
      </Page>

      {/* Passport image page (render only if we have an extracted image) */}
      <PassportPage
        passportSrc={passportSrc}
        candidateCity={candidateCity}
        pdfGeneratedDate={pdfGeneratedDate}
        nameLine={nameLine}
      />
    </Document>
  );
}
