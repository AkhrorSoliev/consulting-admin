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
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 20,
    color: "#2563eb",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    fontStyle: "italic",
    marginTop: 16,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  formLabel: {
    width: 140,
  },
  formValue: {
    flex: 1,
  },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    minHeight: 14,
  },
  contentText: {
    marginTop: 12,
    textAlign: "justify",
  },
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBlock: {
    width: "30%",
  },
  signatureUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 1,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: "center",
  },
});

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

export default function RozilikXatiPdfDocument({ form }) {
  ensureInterRegistered();

  const currentYear = new Date().getFullYear();

  // Nomzod ma'lumotlari
  const nomzodIsm = String(form?.nomzodIsm || "").trim();
  const nomzodFamilya = String(form?.nomzodFamilya || "").trim();
  const nomzodJinsi = String(form?.nomzodJinsi || "").trim();
  const nomzodTugilganSana = String(form?.nomzodTugilganSana || "").trim();
  const nomzodManzil = String(form?.nomzodManzil || "").trim();
  const nomzodOqishJoyi = String(form?.nomzodOqishJoyi || "").trim();
  const nomzodTelefon = String(form?.nomzodTelefon || "").trim();

  // Joy va sana
  const joy = String(form?.joy || "").trim();
  const sana = String(form?.sana || "").trim();

  const FormRow = ({ label, value }) => (
    <View style={s.formRow}>
      <Text style={s.formLabel}>{label}:</Text>
      {hasValue(value) ? (
        <Text style={s.formValue}>{value}</Text>
      ) : (
        <View style={s.formUnderline} />
      )}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>
          {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashga rozilik xati
        </Text>

        <Text style={s.sectionTitle}>NOMZOD HAQIDA MA'LUMOTLAR:</Text>

        <FormRow label="Ismi" value={nomzodIsm} />
        <FormRow label="Familyasi" value={nomzodFamilya} />
        <FormRow label="Jinsi" value={nomzodJinsi} />
        <FormRow label="Tug'ilgan sanasi" value={nomzodTugilganSana} />
        <FormRow label="Manzili" value={nomzodManzil} />
        <FormRow label="O'qish joyi" value={nomzodOqishJoyi} />
        <FormRow label="Telefon raqami" value={nomzodTelefon} />

        <Text style={s.sectionTitle}>
          NOMZODGA ROZILIK XATI BERUVCHI SHAXS HAQIDA MA'LUMOTLAR:
        </Text>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Rozilik xati beruvchi shaxs:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Ismi:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Familyasi:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Jinsi:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Tug'ilgan sanasi:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Manzili:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Ish joyi:</Text>
          <View style={s.formUnderline} />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Telefon raqami:</Text>
          <View style={s.formUnderline} />
        </View>

        <Text style={[s.sectionTitle, { fontStyle: "normal" }]}>
          ROZILIK XATI MAZMUNI:
        </Text>

        <Text style={s.contentText}>
          Yuqorida ma'lumotlari keltirilgan farzandimning {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashiga roziman va uning salomatligi hamda xulqi uchun javobgarlikni o'z bo'ynimga olaman. Yuqorida keltirilgan ma'lumotlar to'g'riligiga kafolat beraman.
        </Text>

        <View style={s.signaturesContainer}>
          <View style={s.signatureBlock}>
            <View style={s.signatureUnderline} />
            <Text style={s.signatureLabel}>
              {hasValue(joy) && hasValue(sana) ? `${joy}, ${sana}` : "Joy, Sana"}
            </Text>
          </View>

          <View style={s.signatureBlock}>
            <View style={s.signatureUnderline} />
            <Text style={s.signatureLabel}>Imzo</Text>
          </View>

          <View style={s.signatureBlock}>
            <View style={s.signatureUnderline} />
            <Text style={s.signatureLabel}>Ism, Familya</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
