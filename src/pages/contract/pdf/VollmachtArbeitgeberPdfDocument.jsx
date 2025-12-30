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

let arimoRegistered = false;
function ensureArimoRegistered() {
  if (arimoRegistered) return;
  arimoRegistered = true;
  Font.register({
    family: "Arimo",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Arimo",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.25,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 10,
    color: "#30849b",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 24,
  },
  p: { marginTop: 0 },
  bold: { fontWeight: 700 },
  table: {
    marginTop: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#334155",
  },
  tableCol: {
    flex: 1,
    borderRightWidth: 1,
  },
  tableColLast: {
    flex: 1,
  },
  tableHeader: {
    padding: 4,
    fontWeight: 700,
    textDecoration: "underline",
  },
  tableHeaderRight: {
    padding: 4,
    fontWeight: 700,
    textAlign: "right",
    textDecoration: "underline",
  },
  tableCell: {
    padding: 5,
  },
  tableCellContent: {
    fontSize: 10,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  fieldValue: {
    flex: 1,
    minHeight: 14,
    justifyContent: "flex-end",
    paddingBottom: 0.5,
  },
  fieldValueUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  placeholderText: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#94a3b8",
  },
  fieldLabel: {
    fontSize: 9,
    fontStyle: "italic",
    opacity: 0.7,
  },
  list: { marginTop: 6, marginLeft: 10 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  liDash: { width: 10 },
  formRow: { flexDirection: "row", marginTop: 4 },
  formLabel: { width: "auto", fontSize: 10 },
  formValue: { flex: 1 },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    minHeight: 14,
  },
  signatureSection: {
    marginTop: 48,
    flexDirection: "row",
    gap: 28,
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
  },
});

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

function getOmitKey(fieldKey) {
  if (!fieldKey) return "";
  return `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

function buildRepAddressLine(form) {
  const street = String(form?.employerRepStreet || "").trim();
  const house = String(form?.employerRepHouseNumber || "").trim();
  const plz = String(form?.employerRepPostalCode || "").trim();
  const city = String(form?.employerRepCity || "").trim();

  let line = "";

  if (street) {
    line += street;
  }
  if (house) {
    line += (line ? ". " : "") + house;
  }
  if (plz) {
    line += (line ? ", " : "") + plz;
  }
  if (city) {
    // two spaces before Ort as requested ("PLZ  Ort")
    line += (plz ? "  " : line ? " " : "") + city;
  }

  return line;
}

function buildEmployerAddressLine(form) {
  const street = String(form?.employerStreet || "").trim();
  const house = String(form?.employerHouseNumber || "").trim();
  const plz = String(form?.employerPostalCode || "").trim();
  const city = String(form?.employerCity || "").trim();

  let line = "";

  if (street) {
    line += street;
  }
  if (house) {
    line += (line ? ". " : "") + house;
  }
  if (plz) {
    line += (line ? ", " : "") + plz;
  }
  if (city) {
    // two spaces before Ort as requested ("PLZ  Ort")
    line += (plz ? "  " : line ? " " : "") + city;
  }

  return line;
}

function FieldWithLabel({ value, label, style, omit }) {
  if (omit) return null;
  const filled = hasValue(value);
  return (
    <View style={[s.fieldRow, style]}>
      <View
        style={[
          s.fieldValue,
          !filled && s.fieldValueUnderline,
          { minHeight: filled ? 12 : 14 },
        ]}
      >
        {filled ? (
          <Text>{value}</Text>
        ) : (
          <Text style={s.placeholderText}>____________________</Text>
        )}
      </View>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
    </View>
  );
}

export default function VollmachtArbeitgeberPdfDocument({ form }) {
  ensureArimoRegistered();

  const isOmitted = (fieldKey) => Boolean(form?.[getOmitKey(fieldKey)]);

  const candidateFieldConfigs = [
    { key: "candidateFirstName" },
    { key: "candidateLastName" },
    { key: "candidateBirthDate" },
    { key: "candidateBirthPlace" },
    { key: "candidateBirthCountry" },
    { key: "candidateStreet" },
    { key: "candidateHouseNumber" },
    { key: "candidatePostalCode" },
    { key: "candidateCity" },
    { key: "candidateCountry" },
    { key: "candidatePhone" },
    { key: "candidateEmail" },
  ];

  const candidateFieldGroups = [
    {
      keys: ["candidateFirstName", "candidateLastName"],
      separator: " ",
    },
    {
      keys: [
        "candidateBirthDate",
        "candidateBirthPlace",
        "candidateBirthCountry",
      ],
      separator: ", ",
    },
    {
      keys: ["candidateStreet", "candidateHouseNumber"],
      separator: " ",
    },
    {
      keys: ["candidatePostalCode", "candidateCity"],
      separator: " ",
    },
    {
      keys: ["candidatePhone"],
      separator: "",
    },
    {
      keys: ["candidateEmail"],
      separator: "",
    },
  ];

  const employerFieldKeys = [
    "employerCompanyName",
    "employerStreet",
    "employerHouseNumber",
    "employerPostalCode",
    "employerCity",
    "employerCountry",
    "employerRepFirstName",
    "employerRepLastName",
    "employerRepStreet",
    "employerRepHouseNumber",
    "employerRepPostalCode",
    "employerRepCity",
    "employerRepCountry",
    "employerRepPhone",
    "employerRepEmail",
  ];

  const employerFieldGroups = [
    {
      keys: ["employerCompanyName"],
      separator: "",
    },
    {
      keys: ["employerStreet", "employerHouseNumber"],
      separator: " ",
      useAddressFunction: true,
    },
    {
      keys: ["employerPostalCode", "employerCity"],
      separator: " ",
    },
    {
      keys: ["employerCountry"],
      separator: "",
    },
    {
      keys: ["employerRepFirstName", "employerRepLastName"],
      separator: " ",
    },
    {
      keys: [
        "employerRepStreet",
        "employerRepHouseNumber",
        "employerRepPostalCode",
        "employerRepCity",
      ],
      separator: " ",
    },
    {
      keys: ["employerRepCountry"],
      separator: "",
    },
    {
      keys: ["employerRepPhone"],
      separator: "",
    },
    {
      keys: ["employerRepEmail"],
      separator: "",
    },
  ];

  const employerDisplayName = (() => {
    const designation = form?.employerDesignation;
    if (hasValue(designation)) return designation;
    const companyName = form?.employerCompanyName;
    if (hasValue(companyName)) return companyName;
    return "";
  })();

  const employerRepDisplayName = (() => {
    const full = form?.employerRepFullName;
    if (hasValue(full)) return full;
    const parts = [form?.employerRepFirstName, form?.employerRepLastName]
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return parts.join(" ");
  })();

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
              {candidateFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form?.[key])
                  .filter((v) => hasValue(v));
                const combinedValue = values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel
                    key={groupIndex}
                    value={combinedValue}
                    omit={isOmitted(group.keys[0])}
                  />
                );
              })}
            </View>
          </View>

          <View style={s.tableColLast}>
            <View style={s.tableHeaderRight}>
              <Text>Arbeitgeber</Text>
            </View>
            <View style={s.tableCell}>
              {employerFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form?.[key])
                  .filter((v) => hasValue(v));
                const combinedValue =
                  group.keys[0] === "employerRepStreet"
                    ? buildRepAddressLine(form)
                    : group.keys[0] === "employerStreet" &&
                      group.useAddressFunction
                    ? buildEmployerAddressLine(form)
                    : values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel
                    key={groupIndex}
                    value={combinedValue}
                    omit={isOmitted(group.keys[0])}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <Text style={s.subtitle}>
          Vollmacht für die Beantragung eines beschleunigten
          Fachkräfteverfahrens
        </Text>

        <Text style={s.p}>
          Hiermit bevollmächtige ich{" "}
          {hasValue(employerDisplayName) ? (
            <Text style={s.bold}>{employerDisplayName}</Text>
          ) : (
            <Text style={s.placeholderText}>____________________</Text>
          )}
        </Text>

        <Text style={s.p}>- im Folgenden: „der Bevollmächtigte",</Text>

        <Text style={[s.p, { textAlign: "justify" }]}>
          vertreten durch{" "}
          {hasValue(employerRepDisplayName) ? (
            <Text style={s.bold}>{employerRepDisplayName}</Text>
          ) : (
            <Text style={s.placeholderText}>____________________</Text>
          )}{" "}
          - Vollmacht, aus der sich deren Vertretungsbefugnis für den
          Arbeitgeber ergibt, muss als Anlage beigefügt werden, bei der
          zuständigen Ausländerbehörde das beschleunigte Fachkräfteverfahren
          nach § 81a AufenthG sowie die sonstigen ggf. damit zusammenhängenden
          und in § 81a Absatz 3 AufenthG aufgeführten Verfahren zu beantragen,
          und mich in diesen Verfahren bezüglich aller gesetzlich zulässigen
          Angelegenheiten außergerichtlich zu vertreten.
        </Text>

        <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
          Ich erteile dem Bevollmächtigten die Befugnis, sämtliche Erklärungen
          und Handlungen verbindlich vorzunehmen, die nach den gesetzlichen
          Regelungen vorgenommen werden können und für die Verfahren
          erforderlich sind.
        </Text>

        <Text style={[s.p, { marginTop: 10 }]}>
          Der Umfang der Vertretungsbefugnis beinhaltet insbesondere
        </Text>

        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1, textAlign: "justify" }}>
              die Vertretung in allen für die Durchführung des beschleunigten
              Fachkräfteverfahrens erforderlichen Angelegenheiten gegenüber der
              zuständigen Ausländerbehörde, der für die berufliche Anerkennung
              zuständigen Stelle sowie der ggf. sonstigen zuständigen Behörden,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1, textAlign: "justify" }}>
              das Ein- und Nachreichen der für die Verfahren erforderlichen
              Unterlagen einschließlich meiner personenbezogenen Daten,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1, textAlign: "justify" }}>
              die Vornahme von Zahlungen von für den Abschluss der Verfahren
              erforderlichen Gebühren,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1, textAlign: "justify" }}>
              die Entgegennahme der die Verfahren betreffenden schriftlichen
              sowie elektronischen Unterlagen, die Durchführung des
              Schriftverkehrs und das Öffnen der an mich adressierten Post und
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text style={{ flex: 1, textAlign: "justify" }}>
              den Antrag auf Aufnahme der Familienzusammenführung nach § 81a
              Absatz 4 AufenthG ins beschleunigte Fachkräfteverfahren.
            </Text>
          </View>
        </View>

        <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
          Der Bevollmächtigte ist berechtigt, eine Untervollmacht, die den
          Umfang dieser Vollmacht nicht überschreiten darf, zu erteilen und zu
          widerrufen [
          <Text style={{ fontStyle: "italic" }}>
            auf die Möglichkeit der Verwendung des Musters für die
            Untervollmacht als Anlage zu einer Vollmacht nach § 81a Abs. 1
            AufenthG wird hingewiesen
          </Text>
          ]. Die Vollmacht erlischt mit Abschluss des beschleunigten
          Fachkräfteverfahrens.
        </Text>

        <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
          Da diese Vollmacht meine rechtliche Möglichkeit selbst zu handeln
          nicht ausschließt, bitte ich um direkten Kontakt zu mir, sofern dies
          zur Klärung von Sachverhalten und zur Verfahrensbeschleunigung
          erforderlich erscheint.
        </Text>

        <View style={s.signatureSection}>
          <View style={s.signatureBlock}>
            {isOmitted("candidatePlaceDate") ? null : (
              <View style={s.formRow}>
                <Text style={s.formLabel}>
                  {form?.candidateBirthPlace || "Ort"},{" "}
                </Text>
                {hasValue(form?.candidatePlaceDate) ? (
                  <Text style={s.formValue}>{form.candidatePlaceDate}</Text>
                ) : (
                  <View style={s.formUnderline} />
                )}
              </View>
            )}
            <View style={s.signatureLabel}>
              <Text></Text>
            </View>
          </View>

          <View style={s.signatureBlock}>
            {isOmitted("employerPlaceDate") ? null : (
              <View style={s.formRow}>
                <Text style={s.formLabel}>{form?.employerCity || "Ort"},</Text>
              </View>
            )}
            <View style={s.signatureLabel}>
              <Text></Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
