import { Document, Image, Page, Text } from "@react-pdf/renderer";
import s, { ensureInterRegistered, getAbsolutePublicUrl } from "./personalfragebogen/styles";
import PersoenlicheAngaben from "./personalfragebogen/PersoenlicheAngaben";
import FinanzUndVisadaten from "./personalfragebogen/FinanzUndVisadaten";
import ErklaerungUndUnterschrift from "./personalfragebogen/ErklaerungUndUnterschrift";

export default function PersonalfragebogenPdfDocument({ form }) {
  ensureInterRegistered();

  const nachname = String(form?.nachname || "").trim();
  const vorname = String(form?.vorname || "").trim();
  const wohnadresseDeutschland = String(form?.wohnadresseDeutschland || "").trim();
  const wohnadresseUsbekistan = String(form?.wohnadresseUsbekistan || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const geschlecht = String(form?.geschlecht || "").trim();
  const staatsangehoerigkeit = String(form?.staatsangehoerigkeit || "usbekisch").trim();
  const schuhgroesse = String(form?.schuhgroesse || "").trim();
  const kleidergroesse = String(form?.kleidergroesse || "").trim();
  const steueridentifikationsnummer = String(form?.steueridentifikationsnummer || "").trim();
  const krankenversicherung = String(form?.krankenversicherung || "").trim();
  const bankName = String(form?.bankName || "").trim();
  const iban = String(form?.iban || "").trim();
  const bic = String(form?.bic || "").trim();
  const visaArt = String(form?.visaArt || "").trim();
  const visaNummer = String(form?.visaNummer || "").trim();
  const visaGueltigkeit = String(form?.visaGueltigkeit || "").trim();
  const datum = String(form?.datum || "").trim();

  const logoUrl = getAbsolutePublicUrl("/consultinguz.png");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Logo - absolute positioned */}
        <Image src={logoUrl} style={s.logo} />

        {/* Title */}
        <Text style={s.title}>PERSONALFRAGEBOGEN</Text>
        <Text style={s.subtitle}>
          Dieser Personalfragebogen dient zur Vorerfassung von Personaldaten, die für die Arbeitgeber in Deutschland relevant sind.
        </Text>
        <Text style={s.subtitleSmall}>
          / (Ushbu ishchi haqidagi ma'lumotnoma ish beruvchiga zarur bo'lgan ma'lumotlarni yig'ish uchun qo'llaniladi)
        </Text>

        <PersoenlicheAngaben
          nachname={nachname}
          vorname={vorname}
          wohnadresseDeutschland={wohnadresseDeutschland}
          wohnadresseUsbekistan={wohnadresseUsbekistan}
          geburtsdatum={geburtsdatum}
          geburtsort={geburtsort}
          geschlecht={geschlecht}
          staatsangehoerigkeit={staatsangehoerigkeit}
          schuhgroesse={schuhgroesse}
          kleidergroesse={kleidergroesse}
        />

        <FinanzUndVisadaten
          steueridentifikationsnummer={steueridentifikationsnummer}
          krankenversicherung={krankenversicherung}
          bankName={bankName}
          iban={iban}
          bic={bic}
          visaArt={visaArt}
          visaNummer={visaNummer}
          visaGueltigkeit={visaGueltigkeit}
        />

        <ErklaerungUndUnterschrift datum={datum} />
      </Page>
    </Document>
  );
}
