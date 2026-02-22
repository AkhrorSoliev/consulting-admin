import {
  Document,
  Font,
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
    paddingTop: 55,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  p: { marginTop: 6 },
  bold: { fontWeight: 700 },
  h: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  list: { marginTop: 6, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  liDash: { width: 10 },
  sigRow: { marginTop: 18 },
  sigTwoCol: { flexDirection: "row", gap: 18, marginTop: 14 },
  sigCol: { flex: 1 },
  sigLabel: { fontSize: 10, marginTop: 2 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
  },
  sigTopName: { fontSize: 11, fontWeight: 700, marginTop: 4 },
});

function safeDate(d) {
  const v = String(d || "").trim();
  return v || "____.__.____";
}

function safeName(n) {
  const v = String(n || "").trim();
  return v || "_____________________";
}

export default function VermittlungsvertragPdfDocument({ form }) {
  ensureInterRegistered();

  // Dynamic candidate data (primary keys + backward-compatible fallbacks)
  const firstName = String(
    form?.candidateFirstName || form?.firstName || "",
  ).trim();
  const lastName = String(
    form?.candidateLastName || form?.lastName || "",
  ).trim();
  const candidateName =
    firstName && lastName ? `${firstName} ${lastName}` : safeName("");

  const candidateBirthPrimary = String(form?.candidateBirthDate || "").trim();
  const candidateBirthFallback = String(form?.candidateBirthPlace || "").trim();
  const candidateBirthDate =
    candidateBirthPrimary || candidateBirthFallback || "__________";

  const nationalityPrimary = String(form?.candidateNationality || "").trim();
  const nationalityFallback = String(form?.candidateLand || "").trim();
  const candidateNationality =
    nationalityPrimary || nationalityFallback || "__________";

  const street = String(form?.candidateStreet || "").trim();
  const houseNumber = String(form?.candidateHouseNumber || "").trim();
  const postalCode = String(form?.candidatePLZ || "").trim();
  const country = String(form?.candidateLand || "").trim();
  const composedAddress = [street, houseNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  const composedAddressWithPostal = [composedAddress, postalCode]
    .filter(Boolean)
    .join(", ")
    .trim();
  const composedAddressFull = [composedAddressWithPostal, country]
    .filter(Boolean)
    .join(", ")
    .trim();
  const candidateAddress =
    composedAddressFull ||
    String(form?.candidateAddress || "").trim() ||
    "__________";
  const candidatePassportNr =
    String(
      form?.candidatePassportNr ||
        form?.passportNumber ||
        form?.passportId ||
        "",
    ).trim() || "__________";
  const signaturePlace =
    String(form?.signatureCity || form?.candidateCity || "").trim() ||
    "__________";
  const signatureDate =
    String(form?.signatureDate || form?.pdfGeneratedDate || "").trim() ||
    safeDate("");

  // Section title style (dark blue, bold)
  const sectionTitle = {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 14,
    color: "#0f172a",
  };
  // Red bold for penalty amounts
  const redBold = { fontWeight: 700, color: "#000000" };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={[s.title, { color: "#1a365d", letterSpacing: 1 }]}>
          VERMITTLUNGSVERTRAG
        </Text>
        <Text
          style={{ textAlign: "center", fontStyle: "italic", marginBottom: 10 }}
        >
          Internationale Arbeitsvermittlung
        </Text>

        <Text style={s.p}>zwischen</Text>
        <View style={{ marginLeft: 16, marginTop: 6 }}>
          <Text style={s.bold}>Orif Akhmadaliev (ConsultingUz)</Text>
          <Text>Alemannenweg 6</Text>
          <Text>72488 Sigmaringen</Text>
          <Text>Deutschland</Text>
          <Text>– nachfolgend „Vermittler" –</Text>
        </View>

        <Text style={[s.p, { marginTop: 10 }]}>und</Text>
        <View style={{ marginLeft: 16, marginTop: 6 }}>
          <Text style={s.bold}>{candidateName}</Text>
          <Text>Geburtsdatum: {candidateBirthDate}</Text>
          <Text>Staatsangehörigkeit: {candidateNationality}</Text>
          <Text>Adresse: {candidateAddress}</Text>
          <Text>Reisepass-Nr.: {candidatePassportNr}</Text>
          <Text>– nachfolgend „Bewerber" –</Text>
        </View>

        <Text style={sectionTitle}>§ 1 Vertragsgegenstand</Text>
        <Text style={s.p}>
          (1) Der Bewerber beauftragt den Vermittler mit der Unterstützung bei
          der Vermittlung eines sozialversicherungspflichtigen
          Beschäftigungsverhältnisses in Deutschland.
        </Text>
        <Text style={s.p}>(2) Der Vermittler erbringt insbesondere:</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Analyse der beruflichen Qualifikation</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Erstellung/Optimierung von Bewerbungsunterlagen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Kontaktaufnahme mit Arbeitgebern</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Organisation von Bewerbungsgesprächen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Koordination im Visum- und Anerkennungsverfahren (rein
              organisatorisch)
            </Text>
          </View>
        </View>
        <Text style={s.p}>
          (3) Ein Anspruch auf erfolgreiche Vermittlung oder Abschluss eines
          Arbeitsvertrages besteht nicht.
        </Text>

        <Text style={sectionTitle}>§ 2 Vergütung</Text>
        <Text style={s.p}>(1) Der Bewerber schuldet keinerlei Vergütung.</Text>
        <Text style={s.p}>
          (2) Die Vergütung des Vermittlers erfolgt ausschließlich durch das
          beauftragende Arbeitgeberunternehmen auf Grundlage eines gesonderten
          Vertrages.
        </Text>
        <Text style={s.p}>
          (3) Dem Bewerber entstehen keine Vermittlungskosten.
        </Text>

        <Text style={sectionTitle}>§ 3 Mitwirkungspflichten des Bewerbers</Text>
        <Text style={s.p}>Der Bewerber verpflichtet sich:</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>1.</Text>
            <Text>vollständige und wahrheitsgemäße Angaben zu machen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>2.</Text>
            <Text>
              ausschließlich echte und unverfälschte Dokumente vorzulegen
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>3.</Text>
            <Text>erforderliche Unterlagen fristgerecht einzureichen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>4.</Text>
            <Text>aktiv am Vermittlungs- und Visumverfahren mitzuwirken</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>5.</Text>
            <Text>
              den Vermittler unverzüglich über Vertragsangebote oder
              Vertragsabschlüsse zu informieren
            </Text>
          </View>
        </View>

        <Text style={sectionTitle}>
          § 4 Internationale Rekrutierung – Risikohinweis
        </Text>
        <Text style={s.p}>(1) Der Bewerber ist darüber informiert, dass:</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Visumserteilungen ausschließlich durch staatliche Behörden
              erfolgen
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Anerkennungsverfahren nicht im Einflussbereich des Vermittlers
              liegen
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              gesetzliche Änderungen Einfluss auf das Verfahren haben können
            </Text>
          </View>
        </View>
        <Text style={s.p}>(2) Der Vermittler übernimmt keine Haftung für:</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Ablehnung oder Verzögerung eines Visums</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>behördliche Entscheidungen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Änderungen gesetzlicher Vorschriften</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Entscheidungen des Arbeitgebers</Text>
          </View>
        </View>

        <Text style={sectionTitle}>
          § 5 Schutzklausel bei schuldhaftem Nichtantritt („Vertragsstrafe
          light")
        </Text>
        <Text style={s.p}>
          (1) Kommt infolge der Tätigkeit des Vermittlers ein Arbeitsvertrag
          zustande und nimmt der Bewerber diesen an, verpflichtet sich der
          Bewerber, den Arbeitsantritt ordnungsgemäß vorzubereiten und
          wahrzunehmen.
        </Text>
        <Text style={s.p}>
          (2) Verletzt der Bewerber diese Verpflichtung schuldhaft, insbesondere
          indem er:
        </Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              vorsätzlich oder grob fahrlässig falsche Angaben gemacht hat
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>nach Visumerteilung ohne wichtigen Grund nicht einreist</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              ohne wichtigen Grund den Arbeitsantritt endgültig ablehnt
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>trotz verbindlicher Zusage nicht erscheint</Text>
          </View>
        </View>
        <Text style={s.p}>
          so ist der Bewerber zur Zahlung einer Vertragsstrafe verpflichtet.
        </Text>
        <Text style={s.p}>
          (3) Die Vertragsstrafe beträgt{" "}
          <Text style={redBold}>
            50 % einer vereinbarten Bruttomonatsvergütung
          </Text>
          , <Text style={redBold}>jedoch maximal 2.000 EUR</Text>.
        </Text>
        <Text style={s.p}>
          (4) Ein wichtiger Grund liegt insbesondere vor bei:
        </Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>nachweisbarer Erkrankung</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>behördlicher Visumablehnung</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              wesentlicher nachträglicher Vertragsänderung durch den Arbeitgeber
            </Text>
          </View>
        </View>
        <Text style={s.p}>
          (5) Dem Bewerber bleibt ausdrücklich der Nachweis gestattet, dass kein
          oder ein wesentlich geringerer Schaden entstanden ist.
        </Text>
        <Text style={s.p}>
          (6) Ein weitergehender Schaden kann geltend gemacht werden; die
          Vertragsstrafe wird angerechnet.
        </Text>

        <Text style={sectionTitle}>
          § 6 Schutz vor Umgehung der Vermittlung (6 Monate)
        </Text>
        <Text style={s.p}>
          (1) Der Bewerber ist berechtigt, sich eigenständig oder über Dritte zu
          bewerben.
        </Text>
        <Text style={s.p}>
          (2) Wird dem Bewerber durch den Vermittler ein konkreter Arbeitgeber
          nachweislich benannt oder vorgestellt, verpflichtet sich der Bewerber,
          für die Dauer von{" "}
          <Text style={s.bold}>6 Monaten ab nachweislicher Benennung</Text>{" "}
          keinen Arbeitsvertrag mit diesem Arbeitgeber ohne Mitwirkung des
          Vermittlers abzuschließen.
        </Text>
        <Text style={s.p}>
          (3) Kommt innerhalb dieses Zeitraums dennoch ein Arbeitsvertrag
          zustande, gilt die Vermittlung als durch den Vermittler erfolgt.
        </Text>
        <Text style={s.p}>
          (4) Diese Regelung gilt ausschließlich für konkret benannte
          Arbeitgeber und stellt kein allgemeines Wettbewerbsverbot dar.
        </Text>
        <Text style={s.p}>
          (5) Dem Bewerber bleibt der Nachweis gestattet, dass der Vertrag
          unabhängig von der Tätigkeit des Vermittlers zustande gekommen ist.
        </Text>
      </Page>

      {/* Page 2 - § 7 dan boshlanadi */}
      <Page size="A4" style={s.page}>
        <Text style={sectionTitle}>§ 7 Datenschutz (DSGVO)</Text>
        <Text style={s.p}>
          (1) Die Verarbeitung personenbezogener Daten erfolgt gemäß Art. 6 Abs.
          1 lit. b DSGVO zur Durchführung dieses Vertrages.
        </Text>
        <Text style={s.p}>(2) Eine Weitergabe erfolgt ausschließlich an:</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>potenzielle Arbeitgeber</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>zuständige Behörden</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Anerkennungsstellen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Visumstellen</Text>
          </View>
        </View>
        <Text style={s.p}>
          (3) Der Bewerber erhält eine gesonderte Datenschutzerklärung gemäß
          Art. 13 DSGVO.
        </Text>
        <Text style={s.p}>
          (4) Daten werden gelöscht, sobald sie für den Vertragszweck nicht mehr
          erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
          bestehen.
        </Text>

        <Text style={sectionTitle}>§ 8 Vertraulichkeit</Text>
        <Text style={s.p}>
          (1) Arbeitgeberinformationen, Vertragsunterlagen und interne
          Informationen sind vertraulich zu behandeln.
        </Text>
        <Text style={s.p}>(2) Eine Weitergabe an Dritte ist unzulässig.</Text>
        <Text style={s.p}>
          (3) Diese Verpflichtung gilt auch nach Vertragsende.
        </Text>

        <Text style={sectionTitle}>§ 9 Haftung</Text>
        <Text style={s.p}>
          (1) Der Vermittler haftet unbeschränkt bei Vorsatz und grober
          Fahrlässigkeit.
        </Text>
        <Text style={s.p}>
          (2) Bei einfacher Fahrlässigkeit haftet der Vermittler nur bei
          Verletzung wesentlicher Vertragspflichten.
        </Text>
        <Text style={s.p}>
          (3) Die Haftung für Schäden aus Verletzung von Leben, Körper oder
          Gesundheit bleibt unberührt.
        </Text>

        <Text style={sectionTitle}>§ 10 Vertragsdauer und Kündigung</Text>
        <Text style={s.p}>
          (1) Der Vertrag wird auf unbestimmte Zeit geschlossen.
        </Text>
        <Text style={s.p}>
          (2) Beide Parteien können jederzeit ohne Angabe von Gründen kündigen.
        </Text>
        <Text style={s.p}>
          (3) Ansprüche nach § 5 und § 6 bleiben unberührt.
        </Text>

        <Text style={sectionTitle}>§ 11 Rechtswahl und Gerichtsstand</Text>
        <Text style={s.p}>
          (1) Es gilt das Recht der Bundesrepublik Deutschland.
        </Text>
        <Text style={s.p}>
          (2) Für Verbraucher gelten die gesetzlichen Gerichtsstandsregelungen.
        </Text>
        <Text style={s.p}>
          (3) Gerichtsstand für Kaufleute ist Sigmaringen.
        </Text>

        <Text style={sectionTitle}>§ 12 Schriftform</Text>
        <Text style={s.p}>
          Änderungen und Ergänzungen bedürfen der Textform.
        </Text>

        <Text style={sectionTitle}>§ 13 Salvatorische Klausel</Text>
        <Text style={s.p}>
          Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im
          Übrigen wirksam.
        </Text>

        <View style={{ marginTop: 20 }}>
          <Text>
            {signaturePlace}, {signatureDate}
          </Text>
          <Text style={{ marginTop: 14 }}>
            Unterschrift Vermittler: ____________________________
          </Text>
          <Text style={{ marginTop: 10 }}>
            Unterschrift Bewerber: ____________________________
          </Text>
        </View>
      </Page>
    </Document>
  );
}
