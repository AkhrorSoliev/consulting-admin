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
    padding: 40,
    paddingTop: 30,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.2,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    position: "absolute",
    top: -15,
    right: -20,
    width: 240,
    height: 96,
    objectFit: "contain",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 2,
    color: "#374151",
  },
  subtitleSmall: {
    fontSize: 8,
    color: "#6b7280",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitleSub: {
    fontSize: 8,
    fontWeight: 400,
    color: "#6b7280",
  },
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 14,
  },
  tableCellLabel: {
    width: "40%",
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
  },
  tableCellValue: {
    width: "60%",
    padding: 4,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 9,
    fontWeight: 600,
  },
  labelSubText: {
    fontSize: 6.25,
    color: "#6b7280",
    fontStyle: "italic",
  },
  valueText: {
    fontSize: 9,
  },
  declaration: {
    marginTop: 10,
    fontSize: 8,
    textAlign: "justify",
    lineHeight: 1.3,
  },
  declarationBold: {
    fontWeight: 700,
  },
  declarationItalic: {
    fontStyle: "italic",
    color: "#6b7280",
  },
  signatureSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "40%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 4,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
});

export default function PersonalfragebogenPdfDocument({ form }) {
  ensureInterRegistered();

  const nachname = String(form?.nachname || "").trim();
  const vorname = String(form?.vorname || "").trim();
  const wohnadresseDeutschland = String(form?.wohnadresseDeutschland || "").trim();
  const wohnadresseUsbekistan = String(form?.wohnadresseUsbekistan || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const geschlecht = String(form?.geschlecht || "").trim();
  const staatsangehoerigkeit = String(form?.staatsangehoerigkeit || "usbekisch").trim();
  const schuhgroesse = String(form?.schuhgroesse || "").trim();
  const kleidergroesse = String(form?.kleidergroesse || "").trim();
  const steueridentifikationsnummer = String(form?.steueridentifikationsnummer || "").trim();
  const krankenversicherung = String(form?.krankenversicherung || "").trim();
  const bankName = String(form?.bankName || "").trim();
  const iban = String(form?.iban || "").trim();
  const bic = String(form?.bic || "").trim();
  const visaArt = String(form?.visaArt || "").trim();
  const visaNummer = String(form?.visaNummer || "").trim();
  const visaGueltigkeit = String(form?.visaGueltigkeit || "").trim();
  const datum = String(form?.datum || "").trim();

  const logoUrl = getAbsolutePublicUrl("/consultinguz.png");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Logo - absolute positioned */}
        <Image src={logoUrl} style={s.logo} />

        {/* Title */}
        <Text style={s.title}>PERSONALFRAGEBOGEN</Text>
        <Text style={s.subtitle}>
          Dieser Personalfragebogen dient zur Vorerfassung von Personaldaten, die für die Arbeitgeber in Deutschland relevant sind.
        </Text>
        <Text style={s.subtitleSmall}>
          / (Ushbu ishchi haqidagi ma'lumotnoma ish beruvchiga zarur bo'lgan ma'lumotlarni yig'ish uchun qo'llaniladi)
        </Text>

        {/* Persönliche Angaben */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 3 }}>
          <Text style={s.sectionTitle}>Persönliche Angaben / </Text>
          <Text style={s.sectionTitleSub}>(Shaxsiy ma'lumotlar)</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Nachname</Text>
              <Text style={s.labelSubText}>(Familiyangiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{nachname}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Vorname</Text>
              <Text style={s.labelSubText}>(Ismingiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{vorname}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Wohnadresse in Deutschland</Text>
              <Text style={s.labelSubText}>(Germaniyaga kelgandan so'ng yashash manzilingiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{wohnadresseDeutschland}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Wohnadresse in Usbekistan</Text>
              <Text style={s.labelSubText}>(O'zbekistondagi yashash manzilingiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{wohnadresseUsbekistan}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Geburtsdatum</Text>
              <Text style={s.labelSubText}>(Tug'ilgan sanangiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{geburtsdatum}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Geburtsort</Text>
              <Text style={s.labelSubText}>(Tug'ilgan joyingiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{geburtsort}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Geschlecht</Text>
              <Text style={s.labelSubText}>(Jinsingiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{geschlecht}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Staatsangehörigkeit</Text>
              <Text style={s.labelSubText}>(qaysi davlat fuqarosi)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{staatsangehoerigkeit}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Schuhgröße</Text>
              <Text style={s.labelSubText}>(oyoq kiyim razmeriz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{schuhgroesse}</Text>
            </View>
          </View>
          <View style={s.tableRowLast}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Kleidergröße</Text>
              <Text style={s.labelSubText}>(Kiyim razmeriz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{kleidergroesse}</Text>
            </View>
          </View>
        </View>

        {/* Steuer */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
          <Text style={s.sectionTitle}>Steuer / </Text>
          <Text style={s.sectionTitleSub}>(Soliq tizimi bo'yicha ma'lumotlar)</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableRowLast}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Steueridentifikationsnummer</Text>
              <Text style={s.labelSubText}>(Agar bundan oldin Germaniyaga kelgan bo'lsangiz, sizga berilgan soliq nomeringiz)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{steueridentifikationsnummer}</Text>
            </View>
          </View>
        </View>

        {/* Krankenversicherung */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
          <Text style={s.sectionTitle}>Krankenversicherung / </Text>
          <Text style={s.sectionTitleSub}>(Tibbiyot sug'urtasi)</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableRowLast}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Krankenversicherung</Text>
              <Text style={s.labelSubText}>(Tibbiyot sug'urtasi nomi va raqami)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{krankenversicherung}</Text>
            </View>
          </View>
        </View>

        {/* Bankdaten */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
          <Text style={s.sectionTitle}>Bankdaten / </Text>
          <Text style={s.sectionTitleSub}>(Germaniyadagi bank hisobn raqami haqida ma'lumotlar)</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Name der Bank <Text style={s.labelSubText}>(Bank nomi)</Text></Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{bankName}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>IBAN <Text style={s.labelSubText}>(IBAN nomeri)</Text></Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{iban}</Text>
            </View>
          </View>
          <View style={s.tableRowLast}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>BIC <Text style={s.labelSubText}>(BIC nomeri)</Text></Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{bic}</Text>
            </View>
          </View>
        </View>

        {/* Visadaten */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
          <Text style={s.sectionTitle}>Visadaten / </Text>
          <Text style={s.sectionTitleSub}>(Viza ma'lumotlari)</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Art des Visums <Text style={s.labelSubText}>(viza turi)</Text></Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{visaArt}</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Nummer des Visums <Text style={s.labelSubText}>(viza nomeri)</Text></Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{visaNummer}</Text>
            </View>
          </View>
          <View style={s.tableRowLast}>
            <View style={s.tableCellLabel}>
              <Text style={s.labelText}>Gültigkeit des Visums (mit Datum)</Text>
              <Text style={s.labelSubText}>(vizaning amal qilish sanasi)</Text>
            </View>
            <View style={s.tableCellValue}>
              <Text style={s.valueText}>{visaGueltigkeit}</Text>
            </View>
          </View>
        </View>

        {/* Erklärung */}
        <Text style={s.declaration}>
          <Text style={s.declarationBold}>Erklärung des Arbeitnehmers: </Text>
          Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen. Ich verpflichte mich, meinem Arbeitgeber alle Änderungen, insbesondere in Bezug auf weitere Beschäftigungen (in Bezug auf Art, Dauer und Entgelt), unverzüglich mitzuteilen. Bei Zuwiderhandlungen (z.B. Falschaussagen) ist mir bekannt, dass der Arbeitgeber mir gegenüber Schadensersatzansprüche geltend machen kann und wird.{" "}
          <Text style={s.declarationItalic}>
            (Ishchining tasdiqlashi: Yuqorida berilgan barcha ma'lumotlar to'g'riligga kafolat beraman va ushbu ma'lumotlar shaxsan o'zim tarafdan to'ldirilganini ham tasdiqlayman. Noto'g'ri ma'lumotlar berilgani uchun javobgarlik borligidan ma'lumotim mavjud)
          </Text>
        </Text>

        {/* Signature Section */}
        <View style={s.signatureSection}>
          <View style={s.signatureBlock}>
            <Text style={s.valueText}>{datum}</Text>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Datum (Sana)</Text>
            </View>
          </View>
          <View style={s.signatureBlock}>
            <Text style={s.valueText}> </Text>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Unterschrift Arbeitnehmer (Ishchining imzosi)</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
