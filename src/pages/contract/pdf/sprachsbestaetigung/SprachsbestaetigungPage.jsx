import { Link, Page, Text, View } from "@react-pdf/renderer";
import { s } from "./styles";

export default function SprachsbestaetigungPage({ form }) {
  // Header fields (company info)
  const firmaName = String(form?.firmaName || "").trim();
  const abteilung = String(form?.abteilung || "").trim();
  const kontaktPerson = String(form?.kontaktPerson || "").trim();
  const strasse = String(form?.strasse || "").trim();
  const plz = String(form?.plz || "").trim();
  const ort = String(form?.ort || "").trim();
  const telefon = String(form?.telefon || "").trim();
  const email = String(form?.email || "").trim();

  // Candidate info
  const kandidatName = String(form?.kandidatName || "").trim();
  const datum = String(form?.datum || "").trim();

  // Content fields
  const praktikumsart = String(form?.praktikumsart || "").trim();

  // Build address line
  const addressLine = [plz, ort].filter(Boolean).join(" ");

  // Get last name (Nachname) for salutation - first word in "Nachname Vorname" format
  const nameParts = kandidatName.split(" ");
  const lastName = nameParts[0] || "";

  return (
    <Page size="A4" style={s.page}>
      {/* Header - Company Info (right aligned) */}
      <View style={s.header}>
        <Text style={s.headerCompany}>{firmaName || "Firmenname"}</Text>
        <Text style={s.headerText}>{abteilung || "Abteilung"}</Text>
        <Text style={s.headerText}>{kontaktPerson || "Kontaktperson"}</Text>
        <Text style={s.headerText}>{strasse || "Stra\u00DFe"}</Text>
        <Text style={s.headerText}>{addressLine || "PLZ Ort"}</Text>
        {telefon && <Text style={s.headerText}>Telefon: {telefon}</Text>}
        {email && (
          <Text style={s.headerText}>
            E-Mail:{" "}
            <Link style={s.headerLink} src={`mailto:${email}`}>
              {email}
            </Link>
          </Text>
        )}
      </View>

      {/* Candidate Name */}
      <Text style={s.candidateName}>{kandidatName || "Kandidat Name"}</Text>

      {/* Date */}
      <Text style={s.dateRow}>Datum: {datum || "DD.MM.YYYY"}</Text>

      {/* Title */}
      <Text style={s.title}>Best\u00E4tigung Deutschkenntnisse</Text>

      {/* Salutation */}
      <Text style={s.salutation}>
        Sehr geehrter Herr {lastName || "Name"},
      </Text>

      {/* Body paragraphs */}
      <Text style={s.paragraph}>
        Wir haben mit Ihnen ein ausf\u00FChrliches Online-Vorstellungsgespr\u00E4ch auf Deutsch gef\u00FChrt.
      </Text>

      <Text style={s.paragraph}>
        Gerne best\u00E4tigen wir Ihnen, dass Ihre Sprachkenntnisse mehr als ausreichend f\u00FCr das{" "}
        {praktikumsart || "Weiterbildungspraktikum"} im {firmaName || "Firmenname"} sind.
      </Text>

      {/* Closing */}
      <Text style={s.closing}>Mit herzlichen Gr\u00FC\u00DFen</Text>

      {/* Signature */}
      <View style={s.signatureSection}>
        <Text style={s.signatureName}>{kontaktPerson || "Name"}</Text>
        <Text style={s.signatureRole}>{abteilung || "Rolle"}</Text>
      </View>
    </Page>
  );
}
