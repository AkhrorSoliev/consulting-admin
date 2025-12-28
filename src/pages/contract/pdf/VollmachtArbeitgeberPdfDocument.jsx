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
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 16,
  },
  p: { marginTop: 8 },
  bold: { fontWeight: 700 },
  table: {
    marginTop: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#334155",
  },
  tableCol: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#334155",
  },
  tableColLast: {
    flex: 1,
  },
  tableHeader: {
    padding: 6,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  tableCell: {
    padding: 8,
    minHeight: 200,
  },
  tableCellContent: {
    fontSize: 10,
    marginTop: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    minHeight: 14,
  },
  fieldLabel: {
    fontSize: 9,
    fontStyle: "italic",
    opacity: 0.7,
  },
  list: { marginTop: 8, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  liDash: { width: 10 },
  formRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  formLabel: { width: 100, fontSize: 10 },
  formValue: { flex: 1 },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    minHeight: 14,
  },
  signatureSection: {
    marginTop: 24,
    flexDirection: "row",
    gap: 32,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 4,
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },
});

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

function FieldWithLabel({ value, label, style }) {
  return (
    <View style={[s.fieldRow, style]}>
      <View style={s.fieldLine}>
        {hasValue(value) && <Text>{value}</Text>}
      </View>
      <Text style={s.fieldLabel}>{label}</Text>
    </View>
  );
}

export default function VollmachtArbeitgeberPdfDocument({ form }) {
  ensureInterRegistered();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Vollmacht nach § 81a Abs. 1 AufenthG</Text>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableCol}>
            <View style={s.tableHeader}>
              <Text>Vollmachtgeber</Text>
            </View>
            <View style={s.tableCell}>
              <FieldWithLabel 
                value={form?.candidateFullName} 
                label="[Vorname Name]" 
              />
              <FieldWithLabel 
                value={form?.candidateBirthInfo} 
                label="[Geburtsdatum, -ort, -land]" 
              />
              <FieldWithLabel 
                value={form?.candidateStreet} 
                label="[Straße Hausnummer]" 
              />
              <FieldWithLabel 
                value={form?.candidateCity} 
                label="[PLZ Ort Land]" 
              />
              <FieldWithLabel 
                value={form?.candidatePhone} 
                label="[Telefonnummer]" 
              />
              <FieldWithLabel 
                value={form?.candidateEmail} 
                label="[E-Mail]" 
              />
            </View>
          </View>
          
          <View style={s.tableColLast}>
            <View style={s.tableHeader}>
              <Text>Arbeitgeber</Text>
            </View>
            <View style={s.tableCell}>
              <FieldWithLabel 
                value={form?.employerCompany} 
                label="[Firma]" 
              />
              <FieldWithLabel 
                value={form?.employerLocation} 
                label="[Geschäftssitz]" 
              />
              
              <View style={{ marginTop: 12, marginBottom: 6 }}>
                <Text style={{ fontSize: 10, opacity: 0.7, textAlign: "right" }}>
                  vertreten durch
                </Text>
              </View>
              
              <FieldWithLabel 
                value={form?.employerRepName} 
                label="[Vorname Name]" 
              />
              <FieldWithLabel 
                value={form?.employerRepAddress} 
                label="[Anschrift]" 
              />
              <FieldWithLabel 
                value={form?.employerRepPhone} 
                label="[Telefonnummer]" 
              />
              <FieldWithLabel 
                value={form?.employerRepEmail} 
                label="[E-Mail]" 
              />
            </View>
          </View>
        </View>

        <Text style={s.subtitle}>
          Vollmacht für die Beantragung eines beschleunigten Fachkräfteverfahrens
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          Hiermit bevollmächtige ich{" "}
          {hasValue(form?.employerDesignation) ? (
            <Text style={s.bold}>{form.employerDesignation}</Text>
          ) : (
            <Text>_________________</Text>
          )}
        </Text>

        <Text style={s.p}>- im Folgenden: „der Bevollmächtigte",</Text>

        <Text style={s.p}>
          vertreten durch{" "}
          {hasValue(form?.employerRepFullName) ? (
            <Text style={s.bold}>{form.employerRepFullName}</Text>
          ) : (
            <Text>_________________</Text>
          )}{" "}
          - Vollmacht, aus der sich deren Vertretungsbefugnis für den Arbeitgeber ergibt, muss als Anlage beigefügt werden, bei der zuständigen Ausländerbehörde das beschleunigte Fachkräfteverfahren nach § 81a AufenthG sowie die sonstigen ggf. damit zusammenhängenden und in § 81a Absatz 3 AufenthG aufgeführten Verfahren zu beantragen, und mich in diesen Verfahren bezüglich aller gesetzlich zulässigen Angelegenheiten außergerichtlich zu vertreten.
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          Ich erteile dem Bevollmächtigten die Befugnis, sämtliche Erklärungen und Handlungen verbindlich vorzunehmen, die nach den gesetzlichen Regelungen vorgenommen werden können und für die Verfahren erforderlich sind.
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          Der Umfang der Vertretungsbefugnis beinhaltet insbesondere
        </Text>

        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1 }}>
              die Vertretung in allen für die Durchführung des beschleunigten Fachkräfteverfahrens erforderlichen Angelegenheiten gegenüber der zuständigen Ausländerbehörde, der für die berufliche Anerkennung zuständigen Stelle sowie der ggf. sonstigen zuständigen Behörden,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1 }}>
              das Ein- und Nachreichen der für die Verfahren erforderlichen Unterlagen einschließlich meiner personenbezogenen Daten,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1 }}>
              die Vornahme von Zahlungen von für den Abschluss der Verfahren erforderlichen Gebühren,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1 }}>
              die Entgegennahme der die Verfahren betreffenden schriftlichen sowie elektronischen Unterlagen, die Durchführung des Schriftverkehrs und das Öffnen der an mich adressierten Post und
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1 }}>
              den Antrag auf Aufnahme der Familienzusammenführung nach § 81a Absatz 4 AufenthG ins beschleunigte Fachkräfteverfahren.
            </Text>
          </View>
        </View>

        <Text style={[s.p, { marginTop: 12 }]}>
          Der Bevollmächtigte ist berechtigt, eine Untervollmacht, die den Umfang dieser Vollmacht nicht überschreiten darf, zu erteilen und zu widerrufen [auf die Möglichkeit der Verwendung des Musters für die Untervollmacht als Anlage zu einer Vollmacht nach § 81a Abs. 1 AufenthG wird hingewiesen]. Die Vollmacht erlischt mit Abschluss des beschleunigten Fachkräfteverfahrens.
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          Da diese Vollmacht meine rechtliche Möglichkeit selbst zu handeln nicht ausschließt, bitte ich um direkten Kontakt zu mir, sofern dies zur Klärung von Sachverhalten und zur Verfahrensbeschleunigung erforderlich erscheint.
        </Text>

        <View style={s.signatureSection}>
          <View style={s.signatureBlock}>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Ort, Datum:</Text>
              {hasValue(form?.candidatePlaceDate) ? (
                <Text style={s.formValue}>{form.candidatePlaceDate}</Text>
              ) : (
                <View style={s.formUnderline} />
              )}
            </View>
            <View style={s.signatureLabel}>
              <Text>Unterschrift Vollmachtgeber</Text>
            </View>
          </View>

          <View style={s.signatureBlock}>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Ort, Datum:</Text>
              {hasValue(form?.employerPlaceDate) ? (
                <Text style={s.formValue}>{form.employerPlaceDate}</Text>
              ) : (
                <View style={s.formUnderline} />
              )}
            </View>
            <View style={s.signatureLabel}>
              <Text>Unterschrift Bevollmächtigter</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

