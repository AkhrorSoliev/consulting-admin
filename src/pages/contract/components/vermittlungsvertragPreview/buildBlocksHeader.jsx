import { SectionTitle, P, Bullet, NumberedItem } from "./BlockPrimitives";

export function buildHeaderBlocks({
  candidateNameLine,
  birthDateLine,
  nationalityLine,
  addressLine,
  passportLine,
}) {
  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold text-[#1a365d] tracking-wide">
            VERMITTLUNGSVERTRAG
          </div>
          <div className="text-[11pt] mt-2 italic">
            Internationale Arbeitsvermittlung
          </div>
        </div>
      ),
    },
    {
      id: "zwischen",
      keepWithNext: true,
      node: (
        <div className="mt-6">
          <div>zwischen</div>
          <div className="mt-4 ml-4">
            <div className="font-bold">Orif Akhmadaliev (ConsultingUz)</div>
            <div>Alemannenweg 6</div>
            <div>72488 Sigmaringen</div>
            <div>Deutschland</div>
            <div>– nachfolgend „Vermittler" –</div>
          </div>

          <div className="mt-4">und</div>

          <div className="mt-4 ml-4">
            <div className="font-bold">{candidateNameLine}</div>
            <div>Geburtsdatum: {birthDateLine}</div>
            <div>Staatsangehörigkeit: {nationalityLine}</div>
            <div>Adresse: {addressLine}</div>
            <div>Reisepass-Nr.: {passportLine}</div>
            <div>– nachfolgend „Bewerber" –</div>
          </div>
        </div>
      ),
    },
    {
      id: "1",
      node: (
        <div>
          <SectionTitle title="§ 1 Vertragsgegenstand" />
          <P>
            (1) Der Bewerber beauftragt den Vermittler mit der Unterstützung bei
            der Vermittlung eines sozialversicherungspflichtigen
            Beschäftigungsverhältnisses in Deutschland.
          </P>
          <P>(2) Der Vermittler erbringt insbesondere:</P>
          <div className="mt-2 ml-6">
            <Bullet>Analyse der beruflichen Qualifikation</Bullet>
            <Bullet>Erstellung/Optimierung von Bewerbungsunterlagen</Bullet>
            <Bullet>Kontaktaufnahme mit Arbeitgebern</Bullet>
            <Bullet>Organisation von Bewerbungsgesprächen</Bullet>
            <Bullet>
              Koordination im Visum- und Anerkennungsverfahren (rein
              organisatorisch)
            </Bullet>
          </div>
          <P>
            (3) Ein Anspruch auf erfolgreiche Vermittlung oder Abschluss eines
            Arbeitsvertrages besteht nicht.
          </P>
        </div>
      ),
    },
    {
      id: "2",
      node: (
        <div>
          <SectionTitle title="§ 2 Vergütung" />
          <P>(1) Der Bewerber schuldet keinerlei Vergütung.</P>
          <P>
            (2) Die Vergütung des Vermittlers erfolgt ausschließlich durch das
            beauftragende Arbeitgeberunternehmen auf Grundlage eines gesonderten
            Vertrages.
          </P>
          <P>(3) Dem Bewerber entstehen keine Vermittlungskosten.</P>
        </div>
      ),
    },
    {
      id: "3",
      node: (
        <div>
          <SectionTitle title="§ 3 Mitwirkungspflichten des Bewerbers" />
          <P>Der Bewerber verpflichtet sich:</P>
          <div className="mt-2 ml-6">
            <NumberedItem n={1}>
              vollständige und wahrheitsgemäße Angaben zu machen
            </NumberedItem>
            <NumberedItem n={2}>
              ausschließlich echte und unverfälschte Dokumente vorzulegen
            </NumberedItem>
            <NumberedItem n={3}>
              erforderliche Unterlagen fristgerecht einzureichen
            </NumberedItem>
            <NumberedItem n={4}>
              aktiv am Vermittlungs- und Visumverfahren mitzuwirken
            </NumberedItem>
            <NumberedItem n={5}>
              den Vermittler unverzüglich über Vertragsangebote oder
              Vertragsabschlüsse zu informieren
            </NumberedItem>
          </div>
        </div>
      ),
    },
  ];
}
