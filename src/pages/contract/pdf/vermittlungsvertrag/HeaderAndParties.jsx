import { Text, View } from "@react-pdf/renderer";
import { s, sectionTitle } from "./styles";

export default function HeaderAndParties({
  candidateName,
  candidateBirthDate,
  candidateNationality,
  candidateAddress,
  candidatePassportNr,
}) {
  return (
    <>
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
    </>
  );
}
