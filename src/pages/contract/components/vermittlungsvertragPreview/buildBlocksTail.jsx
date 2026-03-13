import { SectionTitle, P, Bullet } from "./BlockPrimitives";

export function buildTailBlocks({
  durationYears,
  signaturePlaceLine,
  signatureDateLine,
}) {
  return [
    {
      id: "7",
      forceNewPage: true,
      node: (
        <div>
          <SectionTitle title="§ 7 Datenschutz (DSGVO)" />
          <P>
            (1) Die Verarbeitung personenbezogener Daten erfolgt gemäß Art. 6
            Abs. 1 lit. b DSGVO zur Durchführung dieses Vertrages.
          </P>
          <P>(2) Eine Weitergabe erfolgt ausschließlich an:</P>
          <div className="mt-2 ml-6">
            <Bullet>potenzielle Arbeitgeber</Bullet>
            <Bullet>zuständige Behörden</Bullet>
            <Bullet>Anerkennungsstellen</Bullet>
            <Bullet>Visumstellen</Bullet>
          </div>
          <P>
            (3) Der Bewerber erhält eine gesonderte Datenschutzerklärung gemäß
            Art. 13 DSGVO.
          </P>
          <P>
            (4) Daten werden gelöscht, sobald sie für den Vertragszweck nicht
            mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
            bestehen.
          </P>
        </div>
      ),
    },
    {
      id: "8",
      node: (
        <div>
          <SectionTitle title="§ 8 Vertraulichkeit" />
          <P>
            (1) Arbeitgeberinformationen, Vertragsunterlagen und interne
            Informationen sind vertraulich zu behandeln.
          </P>
          <P>(2) Eine Weitergabe an Dritte ist unzulässig.</P>
          <P>(3) Diese Verpflichtung gilt auch nach Vertragsende.</P>
        </div>
      ),
    },
    {
      id: "9",
      node: (
        <div>
          <SectionTitle title="§ 9 Haftung" />
          <P>
            (1) Der Vermittler haftet unbeschränkt bei Vorsatz und grober
            Fahrlässigkeit.
          </P>
          <P>
            (2) Bei einfacher Fahrlässigkeit haftet der Vermittler nur bei
            Verletzung wesentlicher Vertragspflichten.
          </P>
          <P>
            (3) Die Haftung für Schäden aus Verletzung von Leben, Körper oder
            Gesundheit bleibt unberührt.
          </P>
        </div>
      ),
    },
    {
      id: "10",
      node: (
        <div>
          <SectionTitle title="§ 10 Vertragsdauer und Kündigung" />
          <P>
            (1) Der Vertrag wird für die Dauer von {durationYears} Jahr
            {durationYears !== 1 ? "en" : ""} geschlossen.
          </P>
          <P>
            (2) Beide Parteien können jederzeit ohne Angabe von Gründen
            kündigen.
          </P>
          <P>(3) Ansprüche nach § 5 und § 6 bleiben unberührt.</P>
        </div>
      ),
    },
    {
      id: "11",
      node: (
        <div>
          <SectionTitle title="§ 11 Rechtswahl und Gerichtsstand" />
          <P>(1) Es gilt das Recht der Bundesrepublik Deutschland.</P>
          <P>
            (2) Für Verbraucher gelten die gesetzlichen
            Gerichtsstandsregelungen.
          </P>
          <P>(3) Gerichtsstand für Kaufleute ist Sigmaringen.</P>
        </div>
      ),
    },
    {
      id: "12",
      node: (
        <div>
          <SectionTitle title="§ 12 Schriftform" />
          <P>Änderungen und Ergänzungen bedürfen der Textform.</P>
        </div>
      ),
    },
    {
      id: "13",
      node: (
        <div>
          <SectionTitle title="§ 13 Salvatorische Klausel" />
          <P>
            Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im
            Übrigen wirksam.
          </P>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-10">
          <div>
            {signaturePlaceLine}, {signatureDateLine}
          </div>
          <div className="mt-6">
            Unterschrift Vermittler: ____________________________
          </div>
          <div className="mt-4">
            Unterschrift Bewerber: ____________________________
          </div>
        </div>
      ),
    },
  ];
}
