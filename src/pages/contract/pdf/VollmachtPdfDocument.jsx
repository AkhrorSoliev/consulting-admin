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
    fontSize: 18,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 24,
  },
  p: { marginTop: 8 },
  bold: { fontWeight: 700 },
  list: { marginTop: 8, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  liDash: { width: 10 },
  formRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  formLabel: { width: 120 },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    height: 16,
  },
  sigRow: { marginTop: 32 },
  sigLabel: { fontSize: 10, marginTop: 2 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
  },
});

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

export default function VollmachtPdfDocument({ form }) {
  ensureInterRegistered();

  const lastName = String(form?.lastName || "").trim();
  const firstName = String(form?.firstName || "").trim();
  const birthDate = String(form?.birthDate || "").trim();
  const city = String(form?.city || "").trim();
  const date = String(form?.date || "").trim();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Vollmacht</Text>

        <Text style={s.p}>Hiermit bevollmächtige ich</Text>

        <View style={{ marginLeft: 20, marginTop: 8 }}>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Nachname:</Text>
            {hasValue(lastName) ? (
              <Text style={{ flex: 1 }}>{lastName}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Vorname:</Text>
            {hasValue(firstName) ? (
              <Text style={{ flex: 1 }}>{firstName}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>geboren am:</Text>
            {hasValue(birthDate) ? (
              <Text style={{ flex: 1 }}>{birthDate}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>
        </View>

        <Text style={[s.p, { marginTop: 16 }]}>den Vollmachtnehmer</Text>

        <Text style={[s.p, s.bold, { marginTop: 8 }]}>
          Orif Akhmadaliev, (ConsultingUz), Alemannenweg 6, 72488 Sigmaringen
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          mich zu unterstützen und zu vertreten in der Angelegenheit Erlangung
          und Antritt einer Fachkraft in Deutschland.
        </Text>

        <Text style={[s.p, { marginTop: 12 }]}>
          Die Vollmacht umfasst insbesondere
        </Text>

        <View style={s.list}>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              die Vertretung bei allen erforderlichen Maßnahmen gegenüber
              Behörden und Intuitionen, um eine Fachkraft in Deutschland
              antreten zu können,
            </Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>die Einholung von beglaubigten Übersetzungen,</Text>
          </View>
          <View style={s.liRow}>
            <Text style={s.liDash}>•</Text>
            <Text>
              die Versendung und Entgegennahme von Schriftstücken sowie die
              Abgabe und Entgegennahme von mündlichen Erklärungen im Rahmen der
              vorgenannten Tätigkeiten ist ausdrücklich eingeschlossen.
            </Text>
          </View>
        </View>

        <View style={s.sigRow}>
          <View style={{ marginLeft: 20 }}>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Wohnort:</Text>
              {hasValue(city) ? (
                <Text style={{ flex: 1 }}>{city}</Text>
              ) : (
                <View style={s.formUnderline} />
              )}
            </View>

            <View style={s.formRow}>
              <Text style={s.formLabel}>Datum:</Text>
              {hasValue(date) ? (
                <Text style={{ flex: 1 }}>{date}</Text>
              ) : (
                <View style={s.formUnderline} />
              )}
            </View>

            <View style={[s.formRow, { marginTop: 20 }]}>
              <Text style={s.formLabel}>Unterschrift:</Text>
              <View style={s.formUnderline} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
