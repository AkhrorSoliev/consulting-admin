/**
 * Contract blocks: Header, parties, and sections 1-3.
 */

import { SafeInline } from "./utils";

export function buildIntroBlocks({
  nameLine,
  SectionTitle,
  P,
  Bullet,
}) {
  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold">Beratungsvertrag</div>
        </div>
      ),
    },
    {
      id: "zwischen",
      keepWithNext: true,
      node: (
        <div className="mt-[14pt]">
          <div className="font-semibold">Zwischen</div>
          <div className="mt-[10pt]">
            <div className="font-semibold">
              <SafeInline>{nameLine}</SafeInline>
            </div>
            <div className="mt-[4pt] text-right">
              - nachfolgend „Auftraggeber" genannt –
            </div>
          </div>

          <div className="mt-[12pt]">und</div>

          <div className="mt-[10pt]">
            <div className="font-semibold">ConsultingUz</div>
            <div className="mt-[2pt]">vertreten durch Orif Akhmadaliev</div>
            <div className="mt-[4pt] text-right">
              - nachfolgend „Auftragnehmer" genannt –
            </div>
          </div>

          <div className="mt-[12pt]">
            wird folgender Beratungsvertrag geschlossen:
          </div>
        </div>
      ),
    },
    {
      id: "1",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={1} title="Vertragsgegenstand" />
          <P>
            Der Auftraggeber erteilt hiermit dem Auftragnehmer den Auftrag,
            ihn/sie bei folgenden Vorhaben zu beraten:
          </P>
          <P className="font-medium">
            Unterstützung bei der Suche Arbeitsstelle in Deutschland
          </P>
        </div>
      ),
    },
    {
      id: "2",
      node: (
        <div>
          <SectionTitle n={2} title="Leistungen des Auftragnehmers" />
          <P>
            Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der
            Auftragnehmer insbesondere folgende Leistungen erbringen:
          </P>
          <div className="mt-[6pt]">
            <Bullet>
              Beratung über die Anforderungen der zuständigen Behörden in
              Deutschland
            </Bullet>
            <Bullet>Unterstützung bei der Vorbereitung von Unterlagen</Bullet>
            <Bullet>
              Unterstützung bei der Antragstellung für die Erteilung einer neuen
              Aufenthaltserlaubnis in Deutschland
            </Bullet>
            <Bullet>
              Unterstützung bei der Suche Arbeitsstelle in Deutschland
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "3",
      node: (
        <div>
          <SectionTitle n={3} title="Pflichten des Auftraggebers" />
          <P>
            Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der
            Auftraggeber insbesondere folgende Pflichten erfüllen:
          </P>
          <div className="mt-[6pt]">
            <Bullet>
              Alle angeforderten Unterlagen und Informationen an dem
              Auftragsnehmer fristgerecht liefern
            </Bullet>
            <Bullet>
              Über die Änderungen den Auftragsnehmer rechtzeitig informieren
            </Bullet>
          </div>
        </div>
      ),
    },
  ];
}
