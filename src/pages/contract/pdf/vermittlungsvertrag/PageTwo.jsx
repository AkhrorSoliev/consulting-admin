import { Page, Text, View } from "@react-pdf/renderer";
import { s, sectionTitle } from "./styles";

export default function PageTwo({
  contractDurationYears,
  signaturePlace,
  signatureDate,
}) {
  return (
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
        (1) Der Vertrag wird für die Dauer von {contractDurationYears} Jahr
        {contractDurationYears !== 1 ? "en" : ""} geschlossen.
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
  );
}
