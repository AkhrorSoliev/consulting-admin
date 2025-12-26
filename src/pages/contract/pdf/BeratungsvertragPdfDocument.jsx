import {
  Document,
  Font,
  Image,
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
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"), fontWeight: 400 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
}

const s = StyleSheet.create({
  page: {
    // Match Word "Normal" margins: 1 inch on all sides = 72pt
    padding: 72,
    fontFamily: "Inter",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  h: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  p: { marginTop: 6 },
  list: { marginTop: 6, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  liDash: { width: 10 },
  bold: { fontWeight: 700 },
  signatureRow: { marginTop: 18 },
  sigTwoCol: { flexDirection: "row", gap: 18, marginTop: 14 },
  sigCol: { flex: 1 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#334155", paddingBottom: 2 },
  sigNote: { fontSize: 9, color: "#475569", marginTop: 4 },
  sigLabel: { fontSize: 10, marginTop: 10 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
    marginTop: 10,
  },
  sigTopName: { fontSize: 11, fontWeight: 600, marginTop: 14 },
});

// react-pdf uses points, and percentage strings like "78.4%" are NOT reliable for sizing.
// Keep explicit A4 content width so embedded images don't end up tiny.
const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;
const PAGE_PADDING_PT = 72;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - PAGE_PADDING_PT * 2; // 451pt
const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - PAGE_PADDING_PT * 2; // 698pt
const PASSPORT_BOX_HEIGHT_PT = Math.floor(CONTENT_HEIGHT_PT * 0.5); // ~50% page

function safeDate(d) {
  const v = String(d || "").trim();
  return v || "____.__.____";
}

function safeName(n) {
  const v = String(n || "").trim();
  return v || "_____________________";
}

function parseMoneyEur(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatEur(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "_____ €";
  try {
    return `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: num % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num)} €`;
  } catch {
    return `${String(num)} €`;
  }
}

export default function BeratungsvertragPdfDocument({ form, passportImageDataUrl }) {
  ensureInterRegistered();
  const first = String(form?.firstName || "").trim();
  const last = String(form?.lastName || "").trim();
  const clientFullName = [first, last].filter(Boolean).join(" ").trim();
  const nameLine = safeName(clientFullName);
  const dateLine = safeDate(form?.contractDate);
  const signatureCityLine = String(form?.signatureCity || "").trim() || "_____________________";
  const passportSrc = String(passportImageDataUrl || "").trim();
  const candidateCity = String(form?.candidateCity || "").trim();
  const pdfGeneratedDate = String(form?.pdfGeneratedDate || "").trim();
  const total = parseMoneyEur(form?.feeTotalEur);
  const adv = parseMoneyEur(form?.feeAdvanceEur);
  const rest =
    total != null && adv != null && Number.isFinite(total - adv)
      ? Math.max(0, total - adv)
      : null;
  const totalText = formatEur(total);
  const advText = formatEur(adv);
  const restText = formatEur(rest);

  return (
    <Document>
      {/* Use ONE flowing Page so react-pdf paginates naturally and avoids large blank spaces. */}
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Beratungsvertrag</Text>

        <Text style={s.p}>Zwischen</Text>
        <Text style={[s.p, s.bold]}>{nameLine}</Text>
        <Text style={[s.p, { textAlign: "right" }]}>
          - nachfolgend „Auftraggeber“ genannt –
        </Text>
        <Text style={s.p}>und</Text>
        <Text style={[s.p, s.bold]}>ConsultingUz</Text>
        <Text>vertreten durch Orif Akhmadaliev</Text>
        <Text style={[s.p, { textAlign: "right" }]}>
          - nachfolgend „Auftragnehmer“ genannt –
        </Text>
        <Text style={s.p}>wird folgender Beratungsvertrag geschlossen:</Text>

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

        <Text style={s.h}>8. Wettbewerbsverbot</Text>
        <Text style={s.p}>
          Während der Laufzeit des Vertrages verpflichtet sich der Auftragnehmer, sein Wissen und Können nicht in die Dienste eines mit dem Auftraggeber in Konkurrenz stehenden Unternehmens zu stellen oder ein solches zu gründen.
        </Text>

        <Text style={s.h}>9. Mitwirkungspflicht des Auftraggebers</Text>
        <Text style={s.p}>
          Der Auftraggeber ist verpflichtet, dem Auftragnehmer alle zur Erbringung der vertraglich geschuldeten Leistungen erforderlichen Unterlagen vollständig, richtig und rechtzeitig zur Verfügung zu stellen sowie sämtliche relevanten Informationen mitzuteilen. Er hat den Auftragnehmer über sämtliche Umstände zu informieren, die für die Ausführung des Auftrags von Bedeutung sein könnten.
        </Text>
        <Text style={s.p}>
          Der Auftraggeber hat auf Verlangen des Auftragnehmers die Richtigkeit und Vollständigkeit der übermittelten Unterlagen und Auskünfte schriftlich zu bestätigen.
        </Text>
        <Text style={s.p}>
          9.1 Der Auftraggeber hat dafür Sorge zu tragen, dass dem Auftragnehmer alle für die Ausführung seiner Tätigkeit notwendigen Unterlagen rechtzeitig vorgelegt werden, ihm alle Informationen erteilt werden und er von allen Vorgängen und Umständen in Kenntnis gesetzt wird. Dies gilt auch für Unterlagen, Vorgänge und Umstände, die erst während der Tätigkeit des Auftragnehmers bekannt werden.
        </Text>
        <Text style={s.p}>
          9.2 Auf Verlangen des Auftragnehmers hat der Auftraggeber die Richtigkeit und Vollständigkeit der von ihm vorgelegten Unterlagen sowie seiner Auskünfte und mündlichen Erklärungen schriftlich zu bestätigen.
        </Text>

        <Text style={s.h}>10. Schweigepflicht</Text>
        <Text style={s.p}>
          Der Auftragnehmer ist verpflichtet, über alle Informationen, die ihm im Zusammenhang mit seiner Tätigkeit für den Auftraggeber bekannt werden, Stillschweigen zu bewahren, gleichviel ob es sich dabei um den Auftraggeber selbst oder dessen Geschäftsverbindungen handelt, es sei denn, dass der Auftraggeber ihn von dieser Schweigepflicht entbindet.
        </Text>

        <Text style={s.h}>11. Datenschutz</Text>
        <Text style={s.p}>
          Der Auftragnehmer verpflichtet sich zur Einhaltung sämtlicher datenschutzrechtlicher Vorschriften, insbesondere der Datenschutz-Grundverordnung (DSGVO). Personenbezogene Daten des Auftraggebers dürfen nur verarbeitet werden, soweit dies zur Erfüllung des Vertragszwecks erforderlich ist.
        </Text>
        <Text style={s.p}>
          Der Auftragnehmer gewährleistet, geeignete technische und organisatorische Maßnahmen zum Schutz der personenbezogenen Daten zu treffen und verpflichtet sich, ohne vorherige schriftliche Zustimmung des Auftraggebers keine weiteren Auftragsverarbeiter einzusetzen.
        </Text>
        <Text style={s.p}>
          Im Falle der Einbindung Dritter informiert der Auftragnehmer den Auftraggeber rechtzeitig über Art und Umfang der beabsichtigten Änderungen, damit dieser gegebenenfalls Widerspruch einlegen kann. Für den Fall einer Auftragsverarbeitung gilt Art. 28 Abs. 3 DSGVO.
        </Text>
        <Text style={s.p}>
          11.1 Erfolgt eine Verarbeitung personenbezogener Daten für den Auftraggeber, so ist der Auftragnehmer verpflichtet, hinreichende Garantien dafür zu bieten, dass geeignete technische und organisatorische Maßnahmen so durchgeführt werden, dass die Verarbeitung im Einklang mit den Anforderungen der DSGVO erfolgt und den Schutz der Rechte der betroffenen Person gewährleistet.
        </Text>
        <Text style={s.p}>
          11.2 Der Auftragnehmer nimmt keine weiteren Auftragsverarbeiter ohne vorherige gesonderte oder allgemeine schriftliche Genehmigung des Verantwortlichen in Anspruch. Im Fall einer allgemein schriftlichen Genehmigung informiert der Auftragsverarbeiter den Verantwortlichen immer über jede beabsichtigte Änderung in Bezug auf die Hinzuziehung oder die Ersetzung anderer Auftragsverarbeiter, wodurch der Auftraggeber die Möglichkeit erhält, gegen derartige Veränderungen Einspruch zu erheben. In Bezug auf die Inhalte eines Auftragsdatenverarbeitungsvertrages gelten die Anforderungen nach Art. 28 Abs. 3 DSGVO.
        </Text>

        <Text style={s.h}>12. Vertragsdauer / Kündigung</Text>
        <Text style={s.p}>
          Dieser Vertrag tritt mit der Unterzeichnung durch beide Vertragsparteien in Kraft und wird auf unbestimmte Zeit geschlossen. Er endet automatisch mit der vollständigen Erbringung der in diesem Vertrag vereinbarten Leistungen.
        </Text>
        <Text style={s.p}>
          Beide Vertragsparteien können den Vertrag mit einer Frist von 14 Tagen zum Monatsende kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </Text>
        <Text style={s.p}>
          Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.
        </Text>
        <Text style={s.p}>
          12.1 Der Vertrag wird mit der Unterzeichnung wirksam und läuft auf unbestimmte Zeit und endet mit Erbringung der vereinbarten Leistungen, sofern die Punkte beim 2. vollständig erfüllt sind.
        </Text>
        <Text style={s.p}>
          12.2 Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.
        </Text>

        <Text style={s.h}>13. Aufbewahrung und Rückgabe von Unterlagen</Text>
        <Text style={s.p}>
          Der Auftragnehmer verpflichtet sich, alle ihm zur Verfügung gestellten Geschäfts- und Betriebsunterlagen ordnungsgemäß aufzubewahren, insbesondere dafür zu sorgen, dass Dritte nicht Einsicht nehmen können. Die zur Verfügung gestellten Unterlagen sind während der Dauer des Vertrages auf Anforderung, nach Beendigung des Vertrages unaufgefordert dem Vertragspartner zurückzugeben.
        </Text>

        <Text style={s.h}>14. Sonstige Ansprüche</Text>
        <Text style={s.p}>
          Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung sind sämtliche Ansprüche des Auftragnehmers aus diesem Vertrag abgegolten.
        </Text>
        <Text style={s.p}>
          Der Auftragnehmer ist für die ordnungsgemäße Versteuerung der erhaltenen Vergütung eigenverantwortlich.
        </Text>
        <Text style={s.p}>
          14.1 Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung sind alle Ansprüche des Auftragnehmers gegen den Auftraggeber aus diesem Vertrag erfüllt.
        </Text>
        <Text style={s.p}>
          14.2 Für die Versteuerung der Vergütung hat der Auftragnehmer selbst zu sorgen.
        </Text>

        <Text style={s.h}>15. Schlussbestimmungen</Text>
        <Text style={s.p}>
          15.1 Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer Wirksamkeit der Schriftform. Dies gilt auch für die Änderung oder Aufhebung dieser Klausel.
        </Text>
        <Text style={s.p}>15.2 Mündliche Nebenabreden bestehen nicht.</Text>
        <Text style={s.p}>
          15.3 Sind oder werden einzelne Bestimmungen dieses Vertrages unwirksam, so wird dadurch die Gültigkeit der übrigen Bestimmungen nicht berührt. Die Vertragspartner werden in diesem Fall die ungültige Bestimmung durch eine andere ersetzen, die dem wirtschaftlichen Zweck der weggefallenen Regelung in zulässiger Weise am nächsten kommt.
        </Text>

        <View style={s.signatureRow}>
          <View style={s.sigTwoCol}>
            <View style={s.sigCol}>
              <Text>
                Sigmaringen, <Text style={s.bold}>{dateLine}</Text>
              </Text>
              <Text style={s.sigTopName}>
                <Text style={s.bold}>Orif Akhmadaliev</Text>
              </Text>
              <Text style={s.sigLabel}>Unterschrift:</Text>
              <View style={s.sigUnderline} />
            </View>
            <View style={s.sigCol}>
              <Text>
                <Text style={s.bold}>{signatureCityLine}</Text>, <Text style={s.bold}>{dateLine}</Text>
              </Text>
              <Text style={s.sigTopName}>
                <Text style={s.bold}>{nameLine}</Text>
              </Text>
              <Text style={s.sigLabel}>Unterschrift:</Text>
              <View style={s.sigUnderline} />
            </View>
          </View>
        </View>
      </Page>

      {/* Passport image page (render only if we have an extracted image) */}
      {passportSrc ? (
        // Keep this as a single page (never wrap to an extra page).
        <Page size="A4" style={s.page} wrap={false}>
          {/* Start from top of the content area (not centered / bottom-aligned) */}
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }}>
            {/* Use explicit content width (points) so the image fills the page correctly */}
            <View style={{ width: CONTENT_WIDTH_PT }}>
              <Image
                src={passportSrc}
                style={{
                  width: CONTENT_WIDTH_PT,
                  height: PASSPORT_BOX_HEIGHT_PT,
                  objectFit: "contain",
                  backgroundColor: "#ffffff",
                }}
              />

              <View style={{ marginTop: 14 }}>
                <Text style={{ fontWeight: 600 }}>
                  Datum: {candidateCity ? `${candidateCity}, ` : ""}{pdfGeneratedDate}
                </Text>
                <Text style={{ fontWeight: 600, marginTop: 8 }}>
                  Name: {nameLine}
                </Text>
                <Text style={{ fontWeight: 600, marginTop: 18 }}>
                  Unterschrift:
                </Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#334155", height: 20, marginTop: 10 }} />
              </View>
            </View>
          </View>
        </Page>
      ) : null}
    </Document>
  );
}


