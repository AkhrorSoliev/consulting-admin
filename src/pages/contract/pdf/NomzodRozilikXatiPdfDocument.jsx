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
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 30,
    color: "#2563eb",
    textDecoration: "underline",
  },
  dateRow: {
    textAlign: "right",
    marginBottom: 30,
  },
  paragraph: {
    marginBottom: 16,
    textAlign: "justify",
  },
  signatureSection: {
    marginTop: 40,
  },
  signatureRow: {
    marginBottom: 8,
  },
  signatureLine: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  signatureLabel: {
    width: 60,
    fontWeight: 600,
  },
  signatureUnderline: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    marginLeft: 8,
  },
});

export default function NomzodRozilikXatiPdfDocument({ form }) {
  ensureInterRegistered();

  const sana = String(form?.sana || "").trim();
  const nomzodIsmFamilya = String(form?.nomzodIsmFamilya || "").trim();
  const ishBeruvchiNomi = String(form?.ishBeruvchiNomi || "").trim();
  const kasb = String(form?.kasb || "").trim();
  const dasturSana = String(form?.dasturSana || "").trim();
  const oyNomi = String(form?.oyNomi || "").trim();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Rozilik xati</Text>

        <Text style={s.dateRow}>Sana: {sana || "DD.MM.YYYY"}</Text>

        <Text style={s.paragraph}>
          Men {nomzodIsmFamilya || "kondidat-ism-familyasi"},{" "}
          {ishBeruvchiNomi || "ish-beruvchi-nomi"} kompaniyasi tomonidan taklif
          etilgan {kasb || "Fachkraft für Lagerlogistik"} yo'nalishida{" "}
          {dasturSana || "SANA"} {oyNomi || "OYNOMI"} oyidan boshlanuvchi
          dastur-nomi rozilik beraman va ushbu sanagacha barcha hujjat ishlarida
          ConsultingUz (Orif Akhmadaliev) jamoasini qo'llab-quvvatlayman hamda
          tayyorlov kurslarida faol qatnashib boraman.
        </Text>

        <Text style={s.paragraph}>
          Ushbu qarorimni albatta uyimdagi ota-onam bilan maslahatlashgan holda
          qildim.
        </Text>

        <View style={s.signatureSection}>
          <Text style={s.signatureRow}>Hurmat bilan</Text>
          <Text style={s.signatureRow}>
            {nomzodIsmFamilya || "kondidat-ism-familyasi"}
          </Text>

          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>IMZO:</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
