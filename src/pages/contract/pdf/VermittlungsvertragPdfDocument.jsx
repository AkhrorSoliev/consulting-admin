import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;
  Font.register({
    family: "Inter",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

const s = StyleSheet.create({
  page: {
    padding: 72,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  p: { marginTop: 6 },
  bold: { fontWeight: 700 },
  h: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  list: { marginTop: 6, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  liDash: { width: 10 },
  sigRow: { marginTop: 18 },
  sigTwoCol: { flexDirection: "row", gap: 18, marginTop: 14 },
  sigCol: { flex: 1 },
  sigLabel: { fontSize: 10, marginTop: 2 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
  },
  sigTopName: { fontSize: 11, fontWeight: 700, marginTop: 4 },
});

function safeDate(d) {
  const v = String(d || "").trim();
  return v || "____.__.____";
}

function safeName(n) {
  const v = String(n || "").trim();
  return v || "_____________________";
}

export default function VermittlungsvertragPdfDocument({ form }) {
  ensureInterRegistered();

  const candidateName = String(form?.candidateName || "").trim();
  const nameLine = safeName(candidateName);

  // Calculate contract dates
  const today = new Date();
  const startDate = new Date(today);
  const years = parseInt(form?.contractDurationYears) || 2;
  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + years);

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  };

  const contractStartDate = formatDate(startDate);
  const contractEndDate = formatDate(endDate);
  const signatureDate = safeDate(form?.signatureDate);
  const signatureCity =
    String(form?.signatureCity || "").trim() || "_____________________";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Vermittlungsvertrag</Text>

        <Text style={[s.p, { textAlign: "center" }]}>zwischen:</Text>
        <Text style={[s.p, s.bold, { textAlign: "center" }]}>
          Orif Akhmadaliev
        </Text>
        <Text style={[s.p, { textAlign: "center" }]}>Alemannenweg. 6</Text>
        <Text style={[s.p, { textAlign: "center" }]}>72488 Sigmaringen</Text>
        <Text style={[s.p, { textAlign: "center" }]}>Deutschland</Text>
        <Text style={[s.p, { textAlign: "center" }]}>
          (nachstehend "Vermittler" genannt)
        </Text>

        <Text style={[s.p, { marginTop: 10, textAlign: "center" }]}>und</Text>
        <Text style={[s.p, { textAlign: "center" }]}>
          __________________________________
        </Text>
        <Text style={[s.p, { textAlign: "center" }]}>
          __________________________________
        </Text>
        <Text style={[s.p, { textAlign: "center" }]}>
          __________________________________
        </Text>
        <Text style={[s.p, { textAlign: "center" }]}>
          (nachstehend "Auftraggeber/Bewerber" genannt)
        </Text>

        <Text style={s.h}>1. Leistungen des Vermittlers</Text>
        <Text style={s.p}>
          Der Auftraggeber / Bewerber beauftragt den Vermittler mit seiner
          Arbeitsvermittlung. Dabei erbringt der Vermittler für den Auftraggeber
          / Bewerber folgende Leistungen:
        </Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Individuelle, vermittlungsrelevante Beratung</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Berufsberatung</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Feststellung der Kenntnisse und Fertigkeiten des Auftraggebers
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Unterstützung bei der Erstellung von Bewerbungsunterlagen
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Vorbereitung auf Vorstellungsgespräche</Text>
          </View>
        </View>
        <Text style={s.p}>
          Der Vermittler akquiriert auf Grund des erhobenen Bewerberprofils
          geeignete Arbeitsstellen und unterstützt den Auftraggeber während des
          gesamten Vermittlungsprozesses. Der Vermittler kann an
          Vorstellungsgesprächen teilnehmen.
        </Text>

        <Text style={s.h}>2. Leistungen des Auftraggebers</Text>
        <Text style={s.p}>
          Zur Erfüllung der unter Punkt 1 genannten Leistungen des Vermittlers
          erbringt der Auftraggeber folgende Leistungen:
        </Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Aktive Mithilfe bei der Erstellung des Bewerberprofils</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Wahrheitsgemäße Angaben zu personenbezogenen Daten</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>Einhaltung von vereinbarten Terminen</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Umgehende Mitteilung des Auftraggebers an den Vermittler über das
              Zustandekommen eines sozialversicherungspflichtigen
              Beschäftigungsverhältnisses sowie über dessen vereinbarte Dauer
            </Text>
          </View>
        </View>
        <Text style={s.p}>
          Die Arbeitsplatzangebote des Vermittlers sind vertraulich und nur für
          den Auftraggeber bestimmt. Eine Weitergabe an Dritte bedarf der
          schriftlichen Zustimmung des Vermittlers.
        </Text>

        <Text style={s.h}>3. Vertragsdauer</Text>
        <Text style={s.p}>
          Dieses Vertragsverhältnis beginnt mit Vertragsabschluss und wird auf
          die Gültigkeitsdauer des vom Auftraggeber vorgelegten
          Vermittlungsgutscheines vom{" "}
          <Text style={s.bold}>{contractStartDate}</Text> bis{" "}
          <Text style={s.bold}>{contractEndDate}</Text> befristet und endet
          automatisch ohne eine Kündigung.
        </Text>

        <Text style={s.h}>4. Wettbewerbsabrede</Text>
        <Text style={s.p}>
          Während der Laufzeit des Vertrages darf der Auftraggeber/Bewerber{" "}
          <Text style={s.bold}>nicht</Text> andere Vermittler für sich tätig
          werden lassen.
        </Text>

        <Text style={s.h}>
          5. Geheimhaltungsvereinbarung / Non-Disclosure Agreement (NDA)
        </Text>
        <Text style={s.p}>Auftraggeber verpflichtet sich,</Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              die mitgeteilten Informationen, ohne ausdrückliche schriftliche
              Einwilligung durch den Vermittler nicht selbst zu verwerten;
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              die Vertraulichen Informationen streng vertraulich zu behandeln
              und nur im Zusammenhang mit dem Zweck zu verwenden;
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              die Vertraulichen Informationen ebenfalls durch angemessene
              Geheimhaltungsmaßnahmen gegen den unbefugten Zugriff durch Dritte
              zu sichern und bei der Verarbeitung der Vertraulichen
              Informationen die gesetzlichen und vertraglichen Vorschriften zum
              Datenschutz einzuhalten. Dies beinhaltet auch dem aktuellen Stand
              der Technik angepasste technische Sicherheitsmaßnahmen (Art. 32
              DS-GVO) und die Verpflichtung der Mitarbeiter auf die
              Vertraulichkeit und die Beachtung des Datenschutzes (Art. 28 Abs.
              3 lit. b DS-GVO); Der Vermittler behält sich das alleinige und
              uneingeschränkte Recht zur Schutzrechtsanmeldung vor.
            </Text>
          </View>
        </View>
        <Text style={s.p}>
          Vertrauliche Informationen im Sinne dieser Vereinbarung sind sämtliche
          Informationen (ob schriftlich, elektronisch, mündlich, digital
          verkörpert oder in anderer Form), die von dem Vermittler an den
          Auftraggeber oder einem mit dem Interessenten im Sinne der §§ 15 ff.
          AktG verbundenen Unternehmen zum vorgenannten Zweck offenbart werden.
          Als Vertrauliche Informationen gelten insbesondere:
        </Text>
        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Geschäftsgeheimnisse, Produkte, Bewerbungsprozesse, Know-how,
              Erfindungen, geschäftliche Beziehungen, Geschäftsstrategien,
              Businesspläne, Finanzplanung, Personalangelegenheiten, digital
              verkörperte Informationen (Daten);
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Jegliche Unterlagen und Informationen des Vermittlers, die
              Gegenstand technischer und organisatorischer
              Geheimhaltungsmaßnahmen sind und als vertraulich gekennzeichnet
              oder nach der Art der Information oder den Umständen der
              Übermittlung als vertraulich anzusehen sind;
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>das Bestehen dieser Vereinbarung und ihr Inhalt.</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              Alle Unterlagen (Informationen über Arbeitgeber, Arbeitsverträge,
              Vorabzustimmungen, alle behördliche Unterlagen etc.), die vom
              Vermittler an Auftraggeber zur Verfügung gestellt worden sind
            </Text>
          </View>
        </View>

        <Text style={s.h}>6. Schadens - / Aufwendungsersatz bei Abbruch</Text>
        <Text style={s.p}>
          Für den Fall, dass die Auftraggeber / Bewerber trotz der Zusage der
          Arbeitsgebers und Abschluss eines Ausbildungs- /Arbeitsvertrages -
          egal aus welchem Grund, nicht zu dem in der Stellenanforderung
          vereinbarten Termin, nach Deutschland einreist oder
          Vermittlungsprozess abbricht und nicht hier die Arbeit aufnimmt, ist
          der Vermittler ab Scheitern des Vermittlungsprozesses berechtigt, die,
          bis dahin bei ihm anfallenden Verwaltungskosten als Schadens - /
          Aufwendungsersatz geltend zu machen. Der Auftraggeber / Bewerber
          stimmt dieser Aufrechnung zu.
        </Text>

        <Text style={s.h}>6. Datenschutz</Text>
        <Text style={s.p}>
          Personenbezogene Daten werden vertraulich behandelt und nicht an
          Dritte weitergegeben. Mit der Weitergabe solcher personenbezogenen
          Daten an Dritte, die im Rahmen der Verrichtung der
          Vermittlungstätigkeit erhoben werden, ist der Auftraggeber
          einverstanden.
        </Text>

        <Text style={s.h}>7. Vertragsänderungen / Salvatorische Klausel</Text>
        <Text style={s.p}>
          Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer
          Rechtsgültigkeit der Schriftform. Nebenabreden sind nicht getroffen.
        </Text>
        <Text style={s.p}>
          Sollten einzelne Bestimmungen dieses Vertrages ganz oder teilweise
          unwirksam oder undurchführbar sein oder werden, so berührt das den
          Vertrag im Übrigen nicht. Anstelle der unwirksamen oder
          undurchführbaren Bestimmung gilt eine solche als vereinbart, die dem
          von den Parteien gewollten Zweck der unwirksamen oder undurchführbaren
          Regelung am nächsten kommt.
        </Text>

        <Text style={s.h}>8. Gerichtsstand</Text>
        <Text style={s.p}>
          Der Gerichtsstand ist Namangan (Usbekistan) und Sigmaringen
          (Deutschland).
        </Text>

        <View style={s.sigRow}>
          <View style={s.sigTwoCol}>
            <View style={s.sigCol}>
              <View style={s.sigUnderline} />
              <Text style={[s.sigTopName, { fontStyle: "italic" }]}>
                Orif Akhmadaliev
              </Text>
              <Text style={s.sigLabel}>Vermittler</Text>
            </View>
            <View style={s.sigCol}>
              <View style={s.sigUnderline} />
              <View style={[s.sigUnderline, { marginTop: 6 }]} />
              <Text style={[s.sigLabel, { marginTop: 4 }]}>
                Auftraggeber / Bewerber
              </Text>
            </View>
          </View>
          <Text style={[s.p, { marginTop: 64, textAlign: "left" }]}>
            <Text style={s.bold}>{signatureCity}</Text> /{" "}
            <Text style={s.bold}>{signatureDate}</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}
