import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;
  Font.register({
    family: "Inter",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

const s = StyleSheet.create({
  page: {
    padding: 72,
    fontFamily: "Inter",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "left",
    marginBottom: 60,
    marginLeft: "auto",
  },
  headerCompany: {
    fontSize: 11,
    fontWeight: 700,
  },
  headerText: {
    fontSize: 11,
    marginTop: 2,
  },
  headerLink: {
    fontSize: 11,
    color: "#2563eb",
    textDecoration: "none",
  },
  candidateName: {
    marginBottom: 20,
  },
  dateRow: {
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 30,
  },
  salutation: {
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 16,
    textAlign: "justify",
  },
  closing: {
    marginTop: 30,
    marginBottom: 50,
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureName: {
    fontWeight: 600,
  },
  signatureRole: {
    color: "#2563eb",
  },
});

export default function SprachsbestaetigungPdfDocument({ form }) {
  ensureInterRegistered();

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
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header - Company Info (right aligned) */}
        <View style={s.header}>
          <Text style={s.headerCompany}>{firmaName || "Firmenname"}</Text>
          <Text style={s.headerText}>{abteilung || "Abteilung"}</Text>
          <Text style={s.headerText}>{kontaktPerson || "Kontaktperson"}</Text>
          <Text style={s.headerText}>{strasse || "Straße"}</Text>
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
        <Text style={s.title}>Bestätigung Deutschkenntnisse</Text>

        {/* Salutation */}
        <Text style={s.salutation}>
          Sehr geehrter Herr {lastName || "Name"},
        </Text>

        {/* Body paragraphs */}
        <Text style={s.paragraph}>
          Wir haben mit Ihnen ein ausführliches Online-Vorstellungsgespräch auf Deutsch geführt.
        </Text>

        <Text style={s.paragraph}>
          Gerne bestätigen wir Ihnen, dass Ihre Sprachkenntnisse mehr als ausreichend für das{" "}
          {praktikumsart || "Weiterbildungspraktikum"} im {firmaName || "Firmenname"} sind.
        </Text>

        {/* Closing */}
        <Text style={s.closing}>Mit herzlichen Grüßen</Text>

        {/* Signature */}
        <View style={s.signatureSection}>
          <Text style={s.signatureName}>{kontaktPerson || "Name"}</Text>
          <Text style={s.signatureRole}>{abteilung || "Rolle"}</Text>
        </View>
      </Page>
    </Document>
  );
}
