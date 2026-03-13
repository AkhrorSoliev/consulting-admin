import { Page, Text, View } from "@react-pdf/renderer";
import { s } from "./styles";

export default function EinwilligungserklaerungPage({ form }) {
  // Candidate info
  const anpirede = String(form?.anpirede || "Frau").trim(); // Herr or Frau
  const vorname = String(form?.vorname || "").trim();
  const nachname = String(form?.nachname || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const datum = String(form?.datum || "").trim();

  // Company info
  const verantwortlicher = String(form?.verantwortlicher || "Orif Akhmadaliev").trim();
  const firmaName = String(form?.firmaName || "ConsultingUZ").trim();

  // Build full name for salutation: "Frau Nachname Vorname"
  const fullNameForSalutation = [anpirede, nachname, vorname].filter(Boolean).join(" ");

  return (
    <Page size="A4" style={s.page}>
      {/* Title */}
      <Text style={s.title}>
        Einwilligungserkl\u00E4rung gem\u00E4\u00DF DSGVO in die Verarbeitung von Daten durch{"\n"}
        {firmaName} ({verantwortlicher})
      </Text>

      {/* Salutation */}
      <Text style={s.salutation}>
        Sehr geehrte {fullNameForSalutation || "Name"},
      </Text>

      {/* Introduction */}
      <Text style={s.paragraph}>
        vielen Dank f\u00FCr Ihre Bewerbung. Gem\u00E4\u00DF Art. 13 und Art. 14 DS-GVO (Datenschutz-Grundverordnung) sind wir verpflichtet, Ihnen bestimmte Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten zur Verf\u00FCgung zu stellen. F\u00FCr die personenbezogenen Daten, die Sie uns im Rahmen der Bewerbung bereits zur Verf\u00FCgung gestellt haben, oder die Sie uns im Rahmen des weiteren Bewerbungsverfahrens zur Verf\u00FCgung stellen sowie f\u00FCr weitere personenbezogene Daten, die wir im Rahmen des Bewerbungsverfahrens erheben, verarbeiten und nutzen, gelten die nachfolgend aufgef\u00FChrten Informationen:
      </Text>

      {/* Section: Zwecke */}
      <Text style={s.sectionTitle}>
        Zwecke der Datenverarbeitung personenbezogener Daten sowie die Rechtsgrundlage:
      </Text>
      <Text style={s.paragraph}>
        Die Datenverarbeitung erfolgt ausschlie\u00DFlich zur Durchf\u00FChrung des Bewerbungsverfahrens. Erhebung, Verarbeitung und Nutzung der Daten erfolgen gem\u00E4\u00DF Artikel 88 Abs. 1 DS-GVO in Verbindung mit \u00A7 26 Abs. 1 BDSG.
      </Text>

      {/* Section: Kategorien */}
      <Text style={s.sectionTitle}>
        Kategorien personenbezogener Daten, die verarbeitet werden:
      </Text>
      <Text style={s.paragraph}>
        Im Rahmen der Durchf\u00FChrung des Bewerbungsverfahrens werden die folgenden Kategorien personenbezogener Daten verarbeitet:
      </Text>
      <Text style={s.listItem}>- Kontaktdaten</Text>
      <Text style={s.listItem}>- Bewerbungsunterlagen</Text>
      <Text style={s.listItem}>- ggf. weitere Daten, die Sie uns im Rahmen des Bewerbungsverfahrens zur Verf\u00FCgung stellen</Text>
      <Text style={s.listItem}>- Eigene Aufzeichnungen, Kommentare, Einsch\u00E4tzungen und Beurteilungen, die wir im Rahmen des Bewerbungsverfahrens erstellen</Text>

      {/* Section: Dauer */}
      <Text style={s.sectionTitle}>Dauer der Speicherung:</Text>
      <Text style={s.paragraph}>
        Wir speichern Ihre Daten nur so lange, wie es erforderlich ist, zur Durchf\u00FChrung des Bewerbungsverfahrens sowie zur Erbringung des Nachweises, dass im Bewerbungsverfahren keine Benachteiligung von Bewerbern nach dem Allgemeinen Gleichbehandlungsgesetzes (AGG) vorgelegen hat. Ihre personenbezogenen Daten, die im Rahmen des Bewerbungsverfahrens gespeichert wurden, werden daher 6 Monate nach Abschluss des Bewerbungsverfahrens automatisch gel\u00F6scht.
      </Text>

      {/* Section: Betroffenenrechte */}
      <Text style={s.sectionTitle}>Betroffenenrechte:</Text>
      <Text style={s.paragraph}>
        Sie haben jederzeit das Recht auf Auskunft \u00FCber die zu Ihnen gespeicherten personenbezogenen Daten. Gegebenenfalls haben Sie dar\u00FCber hinaus gem\u00E4\u00DF Artikel 16 bis 20 DS-GVO das Recht auf Berichtigung unrichtiger Daten, das Recht auf L\u00F6schung Ihrer personenbezogenen Daten, das Recht auf Einschr\u00E4nkung der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Daten\u00FCbertragbarkeit.
      </Text>

      {/* Section: Widerruf */}
      <Text style={s.sectionTitle}>Recht auf Widerruf von Einwilligungen:</Text>
      <Text style={s.paragraph}>
        Sofern wir die Verarbeitung und Nutzung Ihrer personenbezogenen Daten aufgrund einer durch Sie erteilten Einwilligung durchf\u00FChren, haben Sie jederzeit das Recht, die Einwilligung zu widerrufen. Der Widerruf gilt mit sofortiger Wirkung f\u00FCr die Zukunft. Die Rechtm\u00E4\u00DFigkeit, der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitungen werden durch den Widerruf nicht ber\u00FChrt.
      </Text>

      {/* Section: Beschwerderecht */}
      <Text style={s.sectionTitle}>Beschwerderecht:</Text>
      <Text style={s.paragraph}>
        Sofern Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DS-GVO verst\u00F6\u00DFt, haben Sie das Recht auf Beschwerde bei einer Aufsichtsbeh\u00F6rde.
      </Text>

      {/* Section: Bereitstellung */}
      <Text style={s.sectionTitle}>Bereitstellung Ihrer personenbezogenen Daten:</Text>
      <Text style={s.paragraph}>
        Die Bereitstellung Ihrer personenbezogenen Daten ist zur Durchf\u00FChrung des Bewerbungsverfahrens und zur Entscheidung \u00FCber die Begr\u00FCndung eines Besch\u00E4ftigungsverh\u00E4ltnisses erforderlich. Eine Nichtbereitstellung Ihrer personenbezogenen Daten hat zur Folge, dass wir das Bewerbungsverfahren nicht durchf\u00FChren k\u00F6nnen und Sie bei der Entscheidung \u00FCber die Begr\u00FCndung eines Besch\u00E4ftigungsverh\u00E4ltnisses leider nicht ber\u00FCcksichtigen k\u00F6nnen.
      </Text>

      {/* Section: Zustimmung */}
      <Text style={s.sectionTitle}>Zustimmung durch den Betroffenen</Text>
      <Text style={s.paragraph}>
        Hiermit versichert der Unterzeichnende, der Erhebung und der Verarbeitung seiner Daten durch{" "}
        <Text style={s.highlight}>{verantwortlicher}</Text> ({firmaName}) freiwillig zuzustimmen und \u00FCber die Datenverarbeitung und seine Rechte belehrt worden zu sein:
      </Text>

      {/* Signature Section */}
      <View style={s.signatureSection}>
        <View style={s.signatureBlock}>
          <Text>{datum || "DD.MM.YYYY"}</Text>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Datum</Text>
          </View>
        </View>
        <View style={s.signatureBlock}>
          <Text>{geburtsort || "___________"}</Text>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Ort</Text>
          </View>
        </View>
        <View style={s.signatureBlock}>
          <Text style={{ color: "#ffffff" }}>___________</Text>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Unterschrift</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={s.footer}>Einwilligung Datenverarbeitung</Text>
    </Page>
  );
}
