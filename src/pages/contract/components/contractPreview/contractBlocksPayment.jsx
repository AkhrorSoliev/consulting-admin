/**
 * Contract blocks: Sections 4-7 (payment, place of work, reporting, expenses).
 */

export function buildPaymentBlocks({
  totalText,
  advText,
  restText,
  SectionTitle,
  P,
}) {
  return [
    {
      // IMPORTANT: split long sections into multiple blocks so pagination
      // doesn't push the entire section to the next page and leave a big gap.
      id: "4-title",
      keepWithNext: true,
      node: <SectionTitle n={4} title="Vergütung" />,
    },
    {
      id: "4-p1",
      node: (
        <P>
          Der Auftragnehmer erhält vom Auftraggeber für die vertraglich
          geschuldeten Leistungen ein pauschales Honorar in Höhe von insgesamt{" "}
          <span className="font-bold">{totalText}</span> einschließlich der
          gesetzlichen Mehrwertsteuer.
        </P>
      ),
    },
    {
      id: "4-p2",
      node: (
        <P>
          Der Auftraggeber verpflichtet sich, bei Vertragsschluss eine nicht
          erstattungsfähige Anzahlung in Höhe von{" "}
          <span className="font-bold">{advText}</span> an den Auftragnehmer zu
          leisten. Der Restbetrag in Höhe von{" "}
          <span className="font-bold">{restText}</span> ist nach erfolgreichem
          Abschluss der vereinbarten Leistungen zur Zahlung fällig.
        </P>
      ),
    },
    {
      id: "4-p3",
      node: (
        <P>
          Die Anzahlung dient zur Absicherung der ersten Aufwendungen und
          Organisationstätigkeiten des Auftragnehmers. Ein
          Rückforderungsanspruch besteht auch im Falle einer einseitigen
          Kündigung oder Nichterfüllung durch den Auftraggeber nicht, sofern der
          Auftragnehmer seine Tätigkeit bereits aufgenommen oder vorbereitende
          Maßnahmen getroffen hat.
        </P>
      ),
    },
    {
      id: "4-1",
      node: (
        <P>
          4.1 Auftragnehmer erhält vom Auftraggeber ein Pauschalhonorar in Höhe
          von insgesamt <span className="font-bold">{totalText}</span> inkl.
          Mehrwertsteuer
        </P>
      ),
    },
    {
      id: "4-2",
      node: (
        <P>
          4.2 Der Auftraggeber zahlt an den Auftragnehmer bei Auftragserteilung
          einen Vorschuss in Höhe von{" "}
          <span className="font-bold">{advText}</span>. Ein weiterer Betrag in
          Höhe von <span className="font-bold">{restText}</span> ist zum
          erfolgreichen Abschluss fällig.
        </P>
      ),
    },
    {
      id: "5",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={5} title="Zeit und Ort der Leistungserbringung" />
          <P>
            5.1 Der Auftragnehmer bestimmt seinen Arbeitsort und seine
            Arbeitszeit eigenverantwortlich.
          </P>
        </div>
      ),
    },
    {
      id: "6",
      node: (
        <div>
          <SectionTitle n={6} title="Berichterstattung" />
          <P>
            Der Auftragnehmer informiert den Auftraggeber regelmäßig über den
            Fortschritt der Beratungsleistungen. Die Berichterstattung erfolgt
            nach Wahl des Auftraggebers entweder einmalig oder in Form von
            Zwischenberichten entsprechend dem Arbeitsfortschritt. Die Berichte
            können auf elektronischem Wege über einen Messenger-Dienst (z. B.
            Telegram) oder per E-Mail übermittelt werden.
          </P>
          <P>
            6.1 Der Auftragnehmer erstattet dem Auftraggeber einen schriftlichen
            Bericht über seine laufende Arbeit und deren Ergebnisse. Die
            Berichterstattung kann nach Wahl des Auftraggebers einmalig oder
            entsprechend dem Arbeitsfortschritt in Form von Zwischenberichten
            erfolgen. Diese kann über Messenger Dienst Telegram oder per Mail
            erfolgen.
          </P>
        </div>
      ),
    },
    {
      id: "7",
      node: (
        <div>
          <SectionTitle n={7} title="Aufwendungsersatz" />
          <P>
            Der Auftraggeber erstattet dem Auftragnehmer nach Vorlage
            entsprechender Nachweise alle erforderlichen und im Zusammenhang mit
            der Vertragserfüllung entstandenen Aufwendungen, soweit diese zuvor
            vom Auftraggeber genehmigt wurden.
          </P>
          <P>
            Unterlässt der Auftraggeber die Erfüllung seiner in Ziffer 3
            genannten Mitwirkungspflichten oder kündigt er den Vertrag vorzeitig
            ohne wichtigen Grund, behält der Auftragnehmer das Recht,
            angefallene Aufwendungen in Rechnung zu stellen. Die geleistete
            Anzahlung wird in diesem Fall nicht erstattet.
          </P>
          <P>
            Der Ersatz weiterer, nicht ausdrücklich vereinbarter Aufwendungen
            bedarf der vorherigen schriftlichen Zustimmung des Auftraggebers.
          </P>
          <P>
            7.1 Der Auftraggeber erstattet dem Auftragnehmer folgende im
            Zusammenhang mit seiner Tätigkeit anfallenden erforderlichen
            Aufwendungen:
          </P>
          <P>
            Wenn der Auftraggeber sein im 3. Punkt genannte Pflichten nicht
            erfüllt oder den Vertrag vorläufig kündigt, wird dem Auftraggeber
            die Aufwandkosten in die Rechnung gestellt oder der Vorschuss nicht
            zurückerstattet.
          </P>
          <P>
            7.2 Der Ersatz aller sonstigen Aufwendungen des Auftragnehmers
            bedarf der (schriftlichen) Zustimmung des Auftraggebers.
          </P>
        </div>
      ),
    },
  ];
}
