import { SectionTitle, P, Bullet } from "./BlockPrimitives";

export function buildBodyBlocks({
  penaltyPercent,
  penaltyMaxEur,
  protectionMonths,
  protectionMonthsLabel,
  protectionMonthsDativeLabel,
}) {
  return [
    {
      id: "4",
      node: (
        <div>
          <SectionTitle title="§ 4 Internationale Rekrutierung – Risikohinweis" />
          <P>(1) Der Bewerber ist darüber informiert, dass:</P>
          <div className="mt-2 ml-6">
            <Bullet>
              Visumserteilungen ausschließlich durch staatliche Behörden
              erfolgen
            </Bullet>
            <Bullet>
              Anerkennungsverfahren nicht im Einflussbereich des Vermittlers
              liegen
            </Bullet>
            <Bullet>
              gesetzliche Änderungen Einfluss auf das Verfahren haben können
            </Bullet>
          </div>
          <P>(2) Der Vermittler übernimmt keine Haftung für:</P>
          <div className="mt-2 ml-6">
            <Bullet>Ablehnung oder Verzögerung eines Visums</Bullet>
            <Bullet>behördliche Entscheidungen</Bullet>
            <Bullet>Änderungen gesetzlicher Vorschriften</Bullet>
            <Bullet>Entscheidungen des Arbeitgebers</Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "5",
      node: (
        <div>
          <SectionTitle title="§ 5 Schutzklausel bei schuldhaftem Nichtantritt (&#8222;Vertragsstrafe light&#8220;)" />
          <P>
            (1) Kommt infolge der Tätigkeit des Vermittlers ein Arbeitsvertrag
            zustande und nimmt der Bewerber diesen an, verpflichtet sich der
            Bewerber, den Arbeitsantritt ordnungsgemäß vorzubereiten und
            wahrzunehmen.
          </P>
          <P>
            (2) Verletzt der Bewerber diese Verpflichtung schuldhaft,
            insbesondere indem er:
          </P>
          <div className="mt-2 ml-6">
            <Bullet>
              vorsätzlich oder grob fahrlässig falsche Angaben gemacht hat
            </Bullet>
            <Bullet>
              nach Visumerteilung ohne wichtigen Grund nicht einreist
            </Bullet>
            <Bullet>
              ohne wichtigen Grund den Arbeitsantritt endgültig ablehnt
            </Bullet>
            <Bullet>trotz verbindlicher Zusage nicht erscheint</Bullet>
          </div>
          <P>
            so ist der Bewerber zur Zahlung einer Vertragsstrafe verpflichtet.
          </P>
          <P>
            (3) Die Vertragsstrafe beträgt{" "}
            <span className="font-bold text-[#c53030]">
              {penaltyPercent} % einer vereinbarten Bruttomonatsvergütung
            </span>
            ,{" "}
            <span className="font-bold text-[#c53030]">
              jedoch maximal {penaltyMaxEur} EUR
            </span>
            .
          </P>
          <P>(4) Ein wichtiger Grund liegt insbesondere vor bei:</P>
          <div className="mt-2 ml-6">
            <Bullet>nachweisbarer Erkrankung</Bullet>
            <Bullet>behördlicher Visumablehnung</Bullet>
            <Bullet>
              wesentlicher nachträglicher Vertragsänderung durch den Arbeitgeber
            </Bullet>
          </div>
          <P>
            (5) Dem Bewerber bleibt ausdrücklich der Nachweis gestattet, dass
            kein oder ein wesentlich geringerer Schaden entstanden ist.
          </P>
          <P>
            (6) Ein weitergehender Schaden kann geltend gemacht werden; die
            Vertragsstrafe wird angerechnet.
          </P>
        </div>
      ),
    },
    {
      id: "6",
      node: (
        <div>
          <SectionTitle
            title={`§ 6 Schutz vor Umgehung der Vermittlung (${protectionMonths} ${protectionMonthsLabel})`}
          />
          <P>
            (1) Der Bewerber ist berechtigt, sich eigenständig oder über Dritte
            zu bewerben.
          </P>
          <P>
            (2) Wird dem Bewerber durch den Vermittler ein konkreter Arbeitgeber
            nachweislich benannt oder vorgestellt, verpflichtet sich der
            Bewerber, für die Dauer von{" "}
            <span className="font-bold">
              {protectionMonths} {protectionMonthsDativeLabel} ab
              nachweislicher Benennung
            </span>{" "}
            keinen Arbeitsvertrag mit diesem Arbeitgeber ohne Mitwirkung des
            Vermittlers abzuschließen.
          </P>
          <P>
            (3) Kommt innerhalb dieses Zeitraums dennoch ein Arbeitsvertrag
            zustande, gilt die Vermittlung als durch den Vermittler erfolgt.
          </P>
          <P>
            (4) Diese Regelung gilt ausschließlich für konkret benannte
            Arbeitgeber und stellt kein allgemeines Wettbewerbsverbot dar.
          </P>
          <P>
            (5) Dem Bewerber bleibt der Nachweis gestattet, dass der Vertrag
            unabhängig von der Tätigkeit des Vermittlers zustande gekommen ist.
          </P>
        </div>
      ),
    },
  ];
}
