import { Text, View } from "@react-pdf/renderer";
import { redBold, s, sectionTitle } from "./styles";

export default function SectionsFourToSix({
  contractProtectionMonths,
  protectionMonthsLabel,
  protectionMonthsDativeLabel,
  penaltyPercent,
  penaltyMaxEur,
}) {
  return (
    <>
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
          {penaltyPercent} % einer vereinbarten Bruttomonatsvergütung
        </Text>
        , <Text style={redBold}>jedoch maximal {penaltyMaxEur} EUR</Text>.
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
        § 6 Schutz vor Umgehung der Vermittlung ({contractProtectionMonths}{" "}
        {protectionMonthsLabel})
      </Text>
      <Text style={s.p}>
        (1) Der Bewerber ist berechtigt, sich eigenständig oder über Dritte zu
        bewerben.
      </Text>
      <Text style={s.p}>
        (2) Wird dem Bewerber durch den Vermittler ein konkreter Arbeitgeber
        nachweislich benannt oder vorgestellt, verpflichtet sich der Bewerber,
        für die Dauer von{" "}
        <Text style={s.bold}>
          {contractProtectionMonths} {protectionMonthsDativeLabel} ab
          nachweislicher Benennung
        </Text>{" "}
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
    </>
  );
}
