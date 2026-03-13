import { Text, View } from "@react-pdf/renderer";
import { s } from "./styles";

export default function ContractSections1to7({ nameLine, totalText, advText, restText }) {
  return (
    <>
      <Text style={s.h}>1. Vertragsgegenstand</Text>
      <Text style={s.p}>
        Der Auftraggeber erteilt hiermit dem Auftragnehmer den Auftrag, ihn/sie
        bei folgenden Vorhaben zu beraten:
      </Text>
      <Text style={[s.p, s.bold]}>
        Unterstützung bei der Suche Arbeitsstelle in Deutschland
      </Text>

      <Text style={s.h}>2. Leistungen des Auftragnehmers</Text>
      <Text style={s.p}>
        Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der Auftragnehmer
        insbesondere folgende Leistungen erbringen:
      </Text>
      <View style={s.list}>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>
            Beratung über die Anforderungen der zuständigen Behörden in Deutschland
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>Unterstützung bei der Vorbereitung von Unterlagen</Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>
            Unterstützung bei der Antragstellung für die Erteilung einer neuen
            Aufenthaltserlaubnis in Deutschland
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>Unterstützung bei der Suche Arbeitsstelle in Deutschland</Text>
        </View>
      </View>

      <Text style={s.h}>3. Pflichten des Auftraggebers</Text>
      <Text style={s.p}>
        Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der Auftraggeber
        insbesondere folgende Pflichten erfüllen:
      </Text>
      <View style={s.list}>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>
            Alle angeforderten Unterlagen und Informationen an dem Auftragsnehmer
            fristgerecht liefern
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>-</Text>
          <Text>Über die Änderungen den Auftragsnehmer rechtzeitig informieren</Text>
        </View>
      </View>

      <Text style={s.h}>4. Vergütung</Text>
      <Text style={s.p}>
        Der Auftragnehmer erhält vom Auftraggeber für die vertraglich geschuldeten
        Leistungen ein pauschales Honorar in Höhe von insgesamt{" "}
        <Text style={s.bold}>{totalText}</Text> einschließlich der gesetzlichen Mehrwertsteuer.
      </Text>
      <Text style={s.p}>
        Der Auftraggeber verpflichtet sich, bei Vertragsschluss eine nicht erstattungsfähige
        Anzahlung in Höhe von <Text style={s.bold}>{advText}</Text> an den Auftragnehmer zu leisten.
        Der Restbetrag in Höhe von <Text style={s.bold}>{restText}</Text> ist nach erfolgreichem Abschluss der vereinbarten Leistungen zur Zahlung fällig.
      </Text>
      <Text style={s.p}>
        Die Anzahlung dient zur Absicherung der ersten Aufwendungen und Organisationstätigkeiten des Auftragnehmers. Ein Rückforderungsanspruch besteht auch im Falle einer einseitigen Kündigung oder Nichterfüllung durch den Auftraggeber nicht, sofern der Auftragnehmer seine Tätigkeit bereits aufgenommen oder vorbereitende Maßnahmen getroffen hat.
      </Text>
      <Text style={s.p}>
        4.1 Auftragnehmer erhält vom Auftraggeber ein Pauschalhonorar in Höhe von insgesamt{" "}
        <Text style={s.bold}>{totalText}</Text> inkl. Mehrwertsteuer
      </Text>
      <Text style={s.p}>
        4.2 Der Auftraggeber zahlt an den Auftragnehmer bei Auftragserteilung einen Vorschuss in Höhe von{" "}
        <Text style={s.bold}>{advText}</Text>. Ein weiterer Betrag in Höhe von{" "}
        <Text style={s.bold}>{restText}</Text> ist zum erfolgreichen Abschluss fällig.
      </Text>

      <Text style={s.h}>5. Zeit und Ort der Leistungserbringung</Text>
      <Text style={s.p}>
        5.1 Der Auftragnehmer bestimmt seinen Arbeitsort und seine Arbeitszeit eigenverantwortlich.
      </Text>

      <Text style={s.h}>6. Berichterstattung</Text>
      <Text style={s.p}>
        Der Auftragnehmer informiert den Auftraggeber regelmäßig über den Fortschritt der Beratungsleistungen. Die Berichterstattung erfolgt nach Wahl des Auftraggebers entweder einmalig oder in Form von Zwischenberichten entsprechend dem Arbeitsfortschritt. Die Berichte können auf elektronischem Wege über einen Messenger-Dienst (z. B. Telegram) oder per E-Mail übermittelt werden.
      </Text>
      <Text style={s.p}>
        6.1 Der Auftragnehmer erstattet dem Auftraggeber einen schriftlichen Bericht über seine laufende Arbeit und deren Ergebnisse. Die Berichterstattung kann nach Wahl des Auftraggebers einmalig oder entsprechend dem Arbeitsfortschritt in Form von Zwischenberichten erfolgen. Diese kann über Messenger Dienst Telegram oder per Mail erfolgen.
      </Text>

      <Text style={s.h}>7. Aufwendungsersatz</Text>
      <Text style={s.p}>
        Der Auftraggeber erstattet dem Auftragnehmer nach Vorlage entsprechender Nachweise alle erforderlichen und im Zusammenhang mit der Vertragserfüllung entstandenen Aufwendungen, soweit diese zuvor vom Auftraggeber genehmigt wurden.
      </Text>
      <Text style={s.p}>
        Unterlässt der Auftraggeber die Erfüllung seiner in Ziffer 3 genannten Mitwirkungspflichten oder kündigt er den Vertrag vorzeitig ohne wichtigen Grund, behält der Auftragnehmer das Recht, angefallene Aufwendungen in Rechnung zu stellen. Die geleistete Anzahlung wird in diesem Fall nicht erstattet.
      </Text>
      <Text style={s.p}>
        Der Ersatz weiterer, nicht ausdrücklich vereinbarter Aufwendungen bedarf der vorherigen schriftlichen Zustimmung des Auftraggebers.
      </Text>
      <Text style={s.p}>
        7.1 Der Auftraggeber erstattet dem Auftragnehmer folgende im Zusammenhang mit seiner Tätigkeit anfallenden erforderlichen Aufwendungen:
      </Text>
      <Text style={s.p}>
        Wenn der Auftraggeber sein im 3. Punkt genannte Pflichten nicht erfüllt oder den Vertrag vorläufig kündigt, wird dem Auftraggeber die Aufwandkosten in die Rechnung gestellt oder der Vorschuss nicht zurückerstattet.
      </Text>
      <Text style={s.p}>
        7.2 Der Ersatz aller sonstigen Aufwendungen des Auftragnehmers bedarf der (schriftlichen) Zustimmung des Auftraggebers.
      </Text>
    </>
  );
}
