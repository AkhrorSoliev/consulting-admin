/**
 * Contract blocks: Sections 13-15 and signature block.
 */

import { SafeInline } from "./utils";

export function buildFinalBlocks({
  nameLine,
  dateLine,
  signatureCityLine,
  SectionTitle,
  P,
}) {
  return [
    {
      id: "13",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle
            n={13}
            title="Aufbewahrung und Rückgabe von Unterlagen"
          />
          <P>
            Der Auftragnehmer verpflichtet sich, alle ihm zur Verfügung
            gestellten Geschäfts- und Betriebsunterlagen ordnungsgemäß
            aufzubewahren, insbesondere dafür zu sorgen, dass Dritte nicht
            Einsicht nehmen können. Die zur Verfügung gestellten Unterlagen sind
            während der Dauer des Vertrages auf Anforderung, nach Beendigung des
            Vertrages unaufgefordert dem Vertragspartner zurückzugeben.
          </P>
        </div>
      ),
    },
    {
      id: "14",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={14} title="Sonstige Ansprüche" />
          <P>
            Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung sind
            sämtliche Ansprüche des Auftragnehmers aus diesem Vertrag
            abgegolten.
          </P>
        </div>
      ),
    },
    {
      id: "14-2",
      node: (
        <div>
          <P>
            Der Auftragnehmer ist für die ordnungsgemäße Versteuerung der
            erhaltenen Vergütung eigenverantwortlich.
          </P>
        </div>
      ),
    },
    {
      id: "14-3",
      node: (
        <div>
          <P>
            14.1 Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung
            sind alle Ansprüche des Auftragnehmers gegen den Auftraggeber aus
            diesem Vertrag erfüllt.
          </P>
        </div>
      ),
    },
    {
      id: "14-4",
      node: (
        <div>
          <P>
            14.2 Für die Versteuerung der Vergütung hat der Auftragnehmer selbst
            zu sorgen.
          </P>
        </div>
      ),
    },
    {
      id: "15",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={15} title="Schlussbestimmungen" />
          <P>
            15.1 Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer
            Wirksamkeit der Schriftform. Dies gilt auch für die Änderung oder
            Aufhebung dieser Klausel.
          </P>
        </div>
      ),
    },
    {
      id: "15-2",
      node: (
        <div>
          <P>15.2 Mündliche Nebenabreden bestehen nicht.</P>
        </div>
      ),
    },
    {
      id: "15-3",
      keepWithNext: true,
      node: (
        <div>
          <P>
            15.3 Sind oder werden einzelne Bestimmungen dieses Vertrages
            unwirksam, so wird dadurch die Gültigkeit der übrigen Bestimmungen
            nicht berührt. Die Vertragspartner werden in diesem Fall die
            ungültige Bestimmung durch eine andere ersetzen, die dem
            wirtschaftlichen Zweck der weggefallenen Regelung in zulässiger
            Weise am nächsten kommt.
          </P>
        </div>
      ),
    },
    {
      id: "15-signature",
      node: (
        <div className="mt-[18pt]">
          <div className="mt-[18pt] flex justify-between gap-12">
            <div className="flex-1">
              <div className="font-medium">
                Sigmaringen, <SafeInline>{dateLine}</SafeInline>
              </div>
              <div className="font-medium">Orif Akhmadaliev</div>
              <div className="text-[10pt]">Unterschrift:</div>
              <div className="border-b border-slate-700 mt-[12pt] h-[22pt]" />
            </div>
            <div className="flex-1">
              <div className="font-medium">
                <SafeInline>{signatureCityLine}</SafeInline>,{" "}
                <SafeInline>{dateLine}</SafeInline>
              </div>
              <div className="font-medium">
                <SafeInline>{nameLine}</SafeInline>
              </div>
              <div className="text-[10pt]">Unterschrift:</div>
              <div className="border-b border-slate-700 mt-[12pt] h-[22pt]" />
            </div>
          </div>
        </div>
      ),
    },
  ];
}
