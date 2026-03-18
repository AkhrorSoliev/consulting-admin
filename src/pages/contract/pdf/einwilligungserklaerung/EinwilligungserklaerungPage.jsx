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
        Einwilligungserklärung gemäß DSGVO in die Verarbeitung von Daten durch{"\n"}
        {firmaName} ({verantwortlicher})
      </Text>

      {/* Salutation */}
      <Text style={s.salutation}>
        Sehr geehrte {fullNameForSalutation || "Name"},
      </Text>

      {/* Introduction */}
      <Text style={s.paragraph}>
        vielen Dank für Ihre Bewerbung. Gemäß Art. 13 und Art. 14 DS-GVO (Datenschutz-Grundverordnung) sind wir verpflichtet, Ihnen bestimmte Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten zur Verfügung zu stellen. Für die personenbezogenen Daten, die Sie uns im Rahmen der Bewerbung bereits zur Verfügung gestellt haben, oder die Sie uns im Rahmen des weiteren Bewerbungsverfahrens zur Verfügung stellen sowie für weitere personenbezogene Daten, die wir im Rahmen des Bewerbungsverfahrens erheben, verarbeiten und nutzen, gelten die nachfolgend aufgeführten Informationen:
      </Text>

      {/* Section: Zwecke */}
      <Text style={s.sectionTitle}>
        Zwecke der Datenverarbeitung personenbezogener Daten sowie die Rechtsgrundlage:
      </Text>
      <Text style={s.paragraph}>
        Die Datenverarbeitung erfolgt ausschließlich zur Durchführung des Bewerbungsverfahrens. Erhebung, Verarbeitung und Nutzung der Daten erfolgen gemäß Artikel 88 Abs. 1 DS-GVO in Verbindung mit § 26 Abs. 1 BDSG.
      </Text>

      {/* Section: Kategorien */}
      <Text style={s.sectionTitle}>
        Kategorien personenbezogener Daten, die verarbeitet werden:
      </Text>
      <Text style={s.paragraph}>
        Im Rahmen der Durchführung des Bewerbungsverfahrens werden die folgenden Kategorien personenbezogener Daten verarbeitet:
      </Text>
      <Text style={s.listItem}>- Kontaktdaten</Text>
      <Text style={s.listItem}>- Bewerbungsunterlagen</Text>
      <Text style={s.listItem}>- ggf. weitere Daten, die Sie uns im Rahmen des Bewerbungsverfahrens zur Verfügung stellen</Text>
      <Text style={s.listItem}>- Eigene Aufzeichnungen, Kommentare, Einschätzungen und Beurteilungen, die wir im Rahmen des Bewerbungsverfahrens erstellen</Text>

      {/* Section: Dauer */}
      <Text style={s.sectionTitle}>Dauer der Speicherung:</Text>
      <Text style={s.paragraph}>
        Wir speichern Ihre Daten nur so lange, wie es erforderlich ist, zur Durchführung des Bewerbungsverfahrens sowie zur Erbringung des Nachweises, dass im Bewerbungsverfahren keine Benachteiligung von Bewerbern nach dem Allgemeinen Gleichbehandlungsgesetzes (AGG) vorgelegen hat. Ihre personenbezogenen Daten, die im Rahmen des Bewerbungsverfahrens gespeichert wurden, werden daher 6 Monate nach Abschluss des Bewerbungsverfahrens automatisch gelöscht.
      </Text>

      {/* Section: Betroffenenrechte */}
      <Text style={s.sectionTitle}>Betroffenenrechte:</Text>
      <Text style={s.paragraph}>
        Sie haben jederzeit das Recht auf Auskunft über die zu Ihnen gespeicherten personenbezogenen Daten. Gegebenenfalls haben Sie darüber hinaus gemäß Artikel 16 bis 20 DS-GVO das Recht auf Berichtigung unrichtiger Daten, das Recht auf Löschung Ihrer personenbezogenen Daten, das Recht auf Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit.
      </Text>

      {/* Section: Widerruf */}
      <Text style={s.sectionTitle}>Recht auf Widerruf von Einwilligungen:</Text>
      <Text style={s.paragraph}>
        Sofern wir die Verarbeitung und Nutzung Ihrer personenbezogenen Daten aufgrund einer durch Sie erteilten Einwilligung durchführen, haben Sie jederzeit das Recht, die Einwilligung zu widerrufen. Der Widerruf gilt mit sofortiger Wirkung für die Zukunft. Die Rechtmäßigkeit, der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitungen werden durch den Widerruf nicht berührt.
      </Text>

      {/* Section: Beschwerderecht */}
      <Text style={s.sectionTitle}>Beschwerderecht:</Text>
      <Text style={s.paragraph}>
        Sofern Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DS-GVO verstößt, haben Sie das Recht auf Beschwerde bei einer Aufsichtsbehörde.
      </Text>

      {/* Section: Bereitstellung */}
      <Text style={s.sectionTitle}>Bereitstellung Ihrer personenbezogenen Daten:</Text>
      <Text style={s.paragraph}>
        Die Bereitstellung Ihrer personenbezogenen Daten ist zur Durchführung des Bewerbungsverfahrens und zur Entscheidung über die Begründung eines Beschäftigungsverhältnisses erforderlich. Eine Nichtbereitstellung Ihrer personenbezogenen Daten hat zur Folge, dass wir das Bewerbungsverfahren nicht durchführen können und Sie bei der Entscheidung über die Begründung eines Beschäftigungsverhältnisses leider nicht berücksichtigen können.
      </Text>

      {/* Section: Zustimmung */}
      <Text style={s.sectionTitle}>Zustimmung durch den Betroffenen</Text>
      <Text style={s.paragraph}>
        Hiermit versichert der Unterzeichnende, der Erhebung und der Verarbeitung seiner Daten durch{" "}
        <Text style={s.highlight}>{verantwortlicher}</Text> ({firmaName}) freiwillig zuzustimmen und über die Datenverarbeitung und seine Rechte belehrt worden zu sein:
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
