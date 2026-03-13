import { Document, Page } from "@react-pdf/renderer";
import HeaderAndParties from "./vermittlungsvertrag/HeaderAndParties";
import PageTwo from "./vermittlungsvertrag/PageTwo";
import SectionsFourToSix from "./vermittlungsvertrag/SectionsFourToSix";
import { ensureInterRegistered, s } from "./vermittlungsvertrag/styles";
import useContractData from "./vermittlungsvertrag/useContractData";

export default function VermittlungsvertragPdfDocument({ form, templateForm }) {
  ensureInterRegistered();

  const data = useContractData(form, templateForm);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <HeaderAndParties
          candidateName={data.candidateName}
          candidateBirthDate={data.candidateBirthDate}
          candidateNationality={data.candidateNationality}
          candidateAddress={data.candidateAddress}
          candidatePassportNr={data.candidatePassportNr}
        />
        <SectionsFourToSix
          contractProtectionMonths={data.contractProtectionMonths}
          protectionMonthsLabel={data.protectionMonthsLabel}
          protectionMonthsDativeLabel={data.protectionMonthsDativeLabel}
          penaltyPercent={data.penaltyPercent}
          penaltyMaxEur={data.penaltyMaxEur}
        />
      </Page>

      {/* Page 2 - § 7 dan boshlanadi */}
      <PageTwo
        contractDurationYears={data.contractDurationYears}
        signaturePlace={data.signaturePlace}
        signatureDate={data.signatureDate}
      />
    </Document>
  );
}
