/**
 * Contract blocks: Sections 8-15 (legal clauses and signature).
 */

import { SafeInline } from "./utils";

export function buildLegalBlocks({
  nameLine,
  dateLine,
  signatureCityLine,
  SectionTitle,
  P,
}) {
  return [
    {
      id: "8",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={8} title="Wettbewerbsverbot" />
          <P>
            Während der Laufzeit des Vertrages verpflichtet sich der
            Auftragnehmer, sein Wissen und Können nicht in die Dienste eines mit
            dem Auftraggeber in Konkurrenz stehenden Unternehmens zu stellen
            oder ein solches zu gründen.
          </P>
        </div>
      ),
    },
    {
      id: "9",
      node: (
        <div>
          <SectionTitle n={9} title="Mitwirkungspflicht des Auftraggebers" />
          <P>
            Der Auftraggeber ist verpflichtet, dem Auftragnehmer alle zur
            Erbringung der vertraglich geschuldeten Leistungen erforderlichen
            Unterlagen vollständig, richtig und rechtzeitig zur Verfügung zu
            stellen sowie sämtliche relevanten Informationen mitzuteilen. Er hat
            den Auftragnehmer über sämtliche Umstände zu informieren, die für
            die Ausführung des Auftrags von Bedeutung sein könnten.
          </P>
          <P>
            Der Auftraggeber hat auf Verlangen des Auftragnehmers die
            Richtigkeit und Vollständigkeit der übermittelten Unterlagen und
            Auskünfte schriftlich zu bestätigen.
          </P>
          <P>
            9.1 Der Auftraggeber hat dafür Sorge zu tragen, dass dem
            Auftragnehmer alle für die Ausführung seiner Tätigkeit notwendigen
            Unterlagen rechtzeitig vorgelegt werden, ihm alle Informationen
            erteilt werden und er von allen Vorgängen und Umständen in Kenntnis
            gesetzt wird. Dies gilt auch für Unterlagen, Vorgänge und Umstände,
            die erst während der Tätigkeit des Auftragnehmers bekannt werden.
          </P>
          <P>
            9.2 Auf Verlangen des Auftragnehmers hat der Auftraggeber die
            Richtigkeit und Vollständigkeit der von ihm vorgelegten Unterlagen
            sowie seiner Auskünfte und mündlichen Erklärungen schriftlich zu
            bestätigen.
          </P>
        </div>
      ),
    },
    {
      id: "10",
      node: (
        <div>
          <SectionTitle n={10} title="Schweigepflicht" />
          <P>
            Der Auftragnehmer ist verpflichtet, über alle Informationen, die ihm
            im Zusammenhang mit seiner Tätigkeit für den Auftraggeber bekannt
            werden, Stillschweigen zu bewahren, gleichviel ob es sich dabei um
            den Auftraggeber selbst oder dessen Geschäftsverbindungen handelt,
            es sei denn, dass der Auftraggeber ihn von dieser Schweigepflicht
            entbindet.
          </P>
        </div>
      ),
    },
    {
      id: "11",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={11} title="Datenschutz" />
          <P>
            Der Auftragnehmer verpflichtet sich zur Einhaltung sämtlicher
            datenschutzrechtlicher Vorschriften, insbesondere der
            Datenschutz-Grundverordnung (DSGVO). Personenbezogene Daten des
            Auftraggebers dürfen nur verarbeitet werden, soweit dies zur
            Erfüllung des Vertragszwecks erforderlich ist.
          </P>
        </div>
      ),
    },
    {
      id: "11-2",
      node: (
        <div>
          <P>
            Der Auftragnehmer gewährleistet, geeignete technische und
            organisatorische Maßnahmen zum Schutz der personenbezogenen Daten zu
            treffen und verpflichtet sich, ohne vorherige schriftliche
            Zustimmung des Auftraggebers keine weiteren Auftragsverarbeiter
            einzusetzen.
          </P>
        </div>
      ),
    },
    {
      id: "11-3",
      node: (
        <div>
          <P>
            Im Falle der Einbindung Dritter informiert der Auftragnehmer den
            Auftraggeber rechtzeitig über Art und Umfang der beabsichtigten
            Änderungen, damit dieser gegebenenfalls Widerspruch einlegen kann.
            Für den Fall einer Auftragsverarbeitung gilt Art. 28 Abs. 3 DSGVO.
          </P>
        </div>
      ),
    },
    {
      id: "11-4",
      node: (
        <div>
          <P>
            11.1 Erfolgt eine Verarbeitung personenbezogener Daten für den
            Auftraggeber, so ist der Auftragnehmer verpflichtet, hinreichende
            Garantien dafür zu bieten, dass geeignete technische und
            organisatorische Maßnahmen so durchgeführt werden, dass die
            Verarbeitung im Einklang mit den Anforderungen der DSGVO erfolgt und
            den Schutz der Rechte der betroffenen Person gewährleistet.
          </P>
        </div>
      ),
    },
    {
      id: "11-5",
      node: (
        <div>
          <P>
            11.2 Der Auftragnehmer nimmt keine weiteren Auftragsverarbeiter ohne
            vorherige gesonderte oder allgemeine schriftliche Genehmigung des
            Verantwortlichen in Anspruch. Im Fall einer allgemein schriftlichen
            Genehmigung informiert der Auftragsverarbeiter den Verantwortlichen
            immer über jede beabsichtigte Änderung in Bezug auf die Hinzuziehung
            oder die Ersetzung anderer Auftragsverarbeiter, wodurch der
            Auftraggeber die Möglichkeit erhält, gegen derartige Veränderungen
            Einspruch zu erheben. In Bezug auf die Inhalte eines
            Auftragsdatenverarbeitungsvertrages gelten die Anforderungen nach
            Art. 28 Abs. 3 DSGVO.
          </P>
        </div>
      ),
    },
    {
      id: "12",
      node: (
        <div>
          <SectionTitle n={12} title="Vertragsdauer / Kündigung" />
          <P>
            Dieser Vertrag tritt mit der Unterzeichnung durch beide
            Vertragsparteien in Kraft und wird auf unbestimmte Zeit geschlossen.
            Er endet automatisch mit der vollständigen Erbringung der in diesem
            Vertrag vereinbarten Leistungen.
          </P>
          <P>
            Beide Vertragsparteien können den Vertrag mit einer Frist von 14
            Tagen zum Monatsende kündigen. Das Recht zur außerordentlichen
            Kündigung aus wichtigem Grund bleibt unberührt.
          </P>
          <P>Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.</P>
          <P>
            12.1 Der Vertrag wird mit der Unterzeichnung wirksam und läuft auf
            unbestimmte Zeit und endet mit Erbringung der vereinbarten
            Leistungen, sofern die Punkte beim 2. vollständig erfüllt sind.
          </P>
          <P>12.2 Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.</P>
        </div>
      ),
    },
  ];
}
