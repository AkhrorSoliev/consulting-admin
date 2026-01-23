import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Link,
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
    padding: 50,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.15,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  titleDe: {
    textDecoration: "underline",
  },
  titleUz: {
    textDecoration: "underline",
    color: "#1e40af",
  },
  headerField: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerLabel: {
    fontWeight: 600,
    width: 140,
  },
  headerValue: {
    flex: 1,
    minHeight: 14,
  },
  headerValueEmpty: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 4,
    textAlign: "justify",
  },
  listItem: {
    marginBottom: 2,
    paddingLeft: 16,
  },
  bullet: {
    position: "absolute",
    left: 0,
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  signatureLabel: {
    fontWeight: 600,
    width: 220,
  },
  signatureLine: {
    flex: 1,
    minHeight: 14,
  },
  signatureLineEmpty: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  link: {
    color: "#2563eb",
    textDecoration: "underline",
  },
  bold: {
    fontWeight: 700,
  },
});

// Translate address/location to Uzbek
function toUzbekText(text) {
  if (!text) return "";
  let result = String(text);
  
  // Region translations
  const regionMap = {
    "Jizzakh Region": "Jizzax viloyati",
    "Tashkent Region": "Toshkent viloyati",
    "Samarkand Region": "Samarqand viloyati",
    "Bukhara Region": "Buxoro viloyati",
    "Fergana Region": "Farg'ona viloyati",
    "Andijan Region": "Andijon viloyati",
    "Namangan Region": "Namangan viloyati",
    "Kashkadarya Region": "Qashqadaryo viloyati",
    "Surkhandarya Region": "Surxondaryo viloyati",
    "Khorezm Region": "Xorazm viloyati",
    "Navoi Region": "Navoiy viloyati",
    "Syrdarya Region": "Sirdaryo viloyati",
    "Karakalpakstan": "Qoraqalpog'iston",
    "Tashkent": "Toshkent",
  };
  
  for (const [en, uz] of Object.entries(regionMap)) {
    result = result.replace(new RegExp(en, "gi"), uz);
  }
  
  // Country
  result = result.replace(/Usbekistan/gi, "O'zbekiston");
  result = result.replace(/Uzbekistan/gi, "O'zbekiston");
  
  // Street - straße/strasse -> ko'chasi (with space before)
  result = result.replace(/(\S)straße/gi, "$1 ko'chasi");
  result = result.replace(/(\S)strasse/gi, "$1 ko'chasi");
  result = result.replace(/straße/gi, "ko'chasi");
  result = result.replace(/strasse/gi, "ko'chasi");
  
  return result;
}

export default function FotoVideoRozilikPdfDocument({ form }) {
  ensureInterRegistered();

  const fullName = String(form?.fullName || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const adresse = String(form?.adresse || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const datum = String(form?.datum || "").trim();
  const email = String(form?.email || "orif.ahmadaliyev@hotmail.de").trim();

  // Uzbek translations
  const adresseUz = toUzbekText(adresse);
  const geburtsortUz = toUzbekText(geburtsort);

  const ortDatum = [geburtsort, datum].filter(Boolean).join(", ");
  const ortDatumUz = [geburtsortUz, datum].filter(Boolean).join(", ");

  return (
    <Document>
      {/* Page 1: German */}
      <Page size="A4" style={s.page}>
        <Text style={[s.title, s.titleDe]}>
          Einwilligungserklärung zur Nutzung von Foto- und Videoaufnahmen
        </Text>

        {/* Header fields */}
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Name der Person:</Text>
          <Text style={fullName ? s.headerValue : s.headerValueEmpty}>{fullName}</Text>
        </View>
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Geburtsdatum:</Text>
          <Text style={geburtsdatum ? s.headerValue : s.headerValueEmpty}>{geburtsdatum}</Text>
        </View>
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Adresse:</Text>
          <Text style={adresse ? s.headerValue : s.headerValueEmpty}>{adresse}</Text>
        </View>

        {/* Section 1 */}
        <Text style={s.sectionTitle}>1. Zweck der Einwilligung</Text>
        <Text style={s.paragraph}>
          Ich willige ein, dass Orif Akhmadaliev (ConsultingUz) nachfolgend „Unternehmen" genannt) Foto- und Videoaufnahmen von mir erstellt und diese zu folgenden Zwecken verwendet:
        </Text>
        <Text style={s.listItem}>• Veröffentlichung auf Social-Media-Plattformen (z. B. Instagram, Facebook, LinkedIn, Telegram, YouTube)</Text>
        <Text style={s.listItem}>• Nutzung auf der Website des Unternehmens</Text>
        <Text style={s.listItem}>• Verwendung für Werbe-, Informations- und Marketingzwecke</Text>
        <Text style={s.listItem}>• Darstellung von Erfolgsgeschichten, Erfahrungsberichten sowie Präsentationen des Unternehmens</Text>

        {/* Section 2 */}
        <Text style={s.sectionTitle}>2. Art der verwendeten Medien</Text>
        <Text style={s.paragraph}>
          Ich willige ein, dass folgende Arten von Medien genutzt werden dürfen:
        </Text>
        <Text style={s.listItem}>• Fotos und Videos (Gruppen- und Einzelaufnahmen)</Text>
        <Text style={s.listItem}>• Kurze Interviews oder Video-Statements</Text>

        {/* Section 3 */}
        <Text style={s.sectionTitle}>3. Umfang der Nutzung</Text>
        <Text style={s.paragraph}>
          Die Aufnahmen dürfen weltweit, zeitlich unbegrenzt und ohne Einschränkung genutzt, vervielfältigt, verbreitet und öffentlich zugänglich gemacht werden.
        </Text>
        <Text style={s.paragraph}>
          Die Einwilligung umfasst insbesondere die Veröffentlichung auf:
        </Text>
        <Text style={s.listItem}>• Instagram, Facebook, LinkedIn, Telegram</Text>
        <Text style={s.listItem}>• Website: consultinguz.de / consultinguz.uz</Text>
        <Text style={s.listItem}>• Sonstige digitale Kommunikationskanäle des Unternehmens</Text>

        {/* Section 4 */}
        <Text style={s.sectionTitle}>4. Freiwilligkeit und Widerruf</Text>
        <Text style={s.paragraph}>
          Die Einwilligung erfolgt freiwillig. Ich kann sie jederzeit mit Wirkung für die Zukunft widerrufen. Ein Widerruf hat keinen Einfluss auf bereits erfolgte Veröffentlichungen, aber zukünftige Nutzungen werden eingestellt.
        </Text>
        <Text style={s.paragraph}>
          Widerrufserklärung bitte senden an:
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.bold}>E-Mail: </Text>
          <Link src={`mailto:${email}`} style={s.link}>{email}</Link>
        </Text>

        {/* Section 5 */}
        <Text style={s.sectionTitle}>5. Rechte an den Aufnahmen</Text>
        <Text style={s.paragraph}>
          Ich bestätige, dass mit der Nutzung der Aufnahmen keine Vergütungsansprüche entstehen.
        </Text>
        <Text style={s.paragraph}>
          Das Unternehmen darf die Aufnahmen bearbeiten, zuschneiden oder in Collagen verwenden, solange meine Persönlichkeitsrechte gewahrt bleiben.
        </Text>

        {/* Section 6 */}
        <Text style={s.sectionTitle}>6. Datenschutz</Text>
        <Text style={s.paragraph}>
          Die Verarbeitung der Daten erfolgt gemäß der geltenden Datenschutzbestimmungen (DSGVO). Es werden ausschließlich die für die Veröffentlichung notwendigen Daten verarbeitet.
        </Text>

        {/* Signature Section */}
        <View style={s.signatureSection}>
          <View style={s.signatureRow}>
            <Text style={s.signatureLabel}>Ort, Datum:</Text>
            <Text style={ortDatum ? s.signatureLine : s.signatureLineEmpty}>{ortDatum}</Text>
          </View>
          <View style={[s.signatureRow, { marginTop: 12 }]}>
            <Text style={s.signatureLabel}>Unterschrift der Person:</Text>
            <Text style={s.signatureLineEmpty}></Text>
          </View>
          <View style={[s.signatureRow, { marginTop: 12 }]}>
            <Text style={s.signatureLabel}>Unterschrift des Unternehmens (optional):</Text>
            <Text style={s.signatureLineEmpty}></Text>
          </View>
        </View>
      </Page>

      {/* Page 2: Uzbek */}
      <Page size="A4" style={s.page}>
        <Text style={[s.title, s.titleUz]}>
          Foto va video tasvirlardan foydalanishga rozilik arizasi
        </Text>

        {/* Header fields */}
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Shaxsning ismi-sharifi:</Text>
          <Text style={fullName ? s.headerValue : s.headerValueEmpty}>{fullName}</Text>
        </View>
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Tug'ilgan sana:</Text>
          <Text style={geburtsdatum ? s.headerValue : s.headerValueEmpty}>{geburtsdatum}</Text>
        </View>
        <View style={s.headerField}>
          <Text style={s.headerLabel}>Manzili:</Text>
          <Text style={adresseUz ? s.headerValue : s.headerValueEmpty}>{adresseUz}</Text>
        </View>

        {/* Section 1 */}
        <Text style={s.sectionTitle}>1. Rozilikning maqsadi</Text>
        <Text style={s.paragraph}>
          Men ushbu ariza orqali Orif Akhmadaliev (ConsultingUz) (keyingi o'rinlarda <Text style={s.bold}>"Kompaniya"</Text> deb yuritiladi) tomonidan mening foto va video tasvirlarimni yaratish va ulardan quyidagi maqsadlarda foydalanishga rozilik bildiraman:
        </Text>
        <Text style={s.listItem}>• Ijtimoiy tarmoqlarda joylashtirish (masalan: Instagram, Facebook, LinkedIn, Telegram, YouTube)</Text>
        <Text style={s.listItem}>• Kompaniyaning rasmiy veb-saytida foydalanish</Text>
        <Text style={s.listItem}>• Reklama, axborot va marketing maqsadlarida qo'llash</Text>
        <Text style={s.listItem}>• Muvaffaqiyat tarixlari, tajriba hikoyalari hamda kompaniya taqdimotlarida foydalanish</Text>

        {/* Section 2 */}
        <Text style={s.sectionTitle}>2. Foydalaniladigan media turlari</Text>
        <Text style={s.paragraph}>
          Quyidagi media turlaridan foydalanishga roziman:
        </Text>
        <Text style={s.listItem}>• Foto va video tasvirlar (yakka va guruh suratlari)</Text>
        <Text style={s.listItem}>• Qisqa intervyular yoki video murojaatlar</Text>

        {/* Section 3 */}
        <Text style={s.sectionTitle}>3. Foydalanish doirasi</Text>
        <Text style={s.paragraph}>
          Tasvirlar dunyo bo'ylab, muddatsiz va hech qanday cheklovlarsiz foydalanilishi, nusxa ko'chirilishi, tarqatilishi va ommaga taqdim etilishiga roziman.
        </Text>
        <Text style={s.paragraph}>
          Ushbu rozilik quyidagilardagi e'lonlarni o'z ichiga oladi:
        </Text>
        <Text style={s.listItem}>• Instagram, Facebook, LinkedIn, Telegram</Text>
        <Text style={s.listItem}>• Kompaniyaning rasmiy saytlarida: consultinguz.de / consultinguz.uz</Text>
        <Text style={s.listItem}>• Kompaniyaning boshqa raqamli aloqa kanallarida</Text>

        {/* Section 4 */}
        <Text style={s.sectionTitle}>4. Ixtiyoriylik va bekor qilish huquqi</Text>
        <Text style={s.paragraph}>
          Ushbu rozilik ixtiyoriy ravishda berilmoqda. Men istalgan vaqtda kelajak uchun roziligimni bekor qilishim mumkin. Bekor qilishgacha bo'lgan e'lonlarga o'zgarish kiritilmaydi, lekin kelgusida foydalanish to'xtatiladi.
        </Text>
        <Text style={s.paragraph}>
          Bekor qilish uchun murojaat:
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.bold}>E-mail: </Text>
          <Link src={`mailto:${email}`} style={s.link}>{email}</Link>
        </Text>

        {/* Section 5 */}
        <Text style={s.sectionTitle}>5. Tasvirlarga bo'lgan huquqlar</Text>
        <Text style={s.paragraph}>
          Men tasdiqlayman ki, ushbu tasvirlardan foydalanish uchun hech qanday to'lov yoki mukofot talab qilmayman.
        </Text>
        <Text style={s.paragraph}>
          Kompaniya mening shaxsiy huquqlarimni hurmat qilgan holda tasvirlarni tahrirlashi, kesishi yoki kollaj shaklida qayta ishlashi mumkin.
        </Text>

        {/* Section 6 */}
        <Text style={s.sectionTitle}>6. Shaxsiy ma'lumotlarni himoya qilish</Text>
        <Text style={s.paragraph}>
          Ma'lumotlar amaldagi ma'lumotlarni himoya qilish qonunchiligiga (DSGVO) muvofiq qayta ishlanadi. Faqat e'lon qilish uchun zarur bo'lgan ma'lumotlargina qayta ishlanadi.
        </Text>

        {/* Signature Section */}
        <View style={s.signatureSection}>
          <View style={s.signatureRow}>
            <Text style={s.signatureLabel}>Joy, sana:</Text>
            <Text style={ortDatumUz ? s.signatureLine : s.signatureLineEmpty}>{ortDatumUz}</Text>
          </View>
          <View style={[s.signatureRow, { marginTop: 12 }]}>
            <Text style={s.signatureLabel}>Shaxsning imzosi:</Text>
            <Text style={s.signatureLineEmpty}></Text>
          </View>
          <View style={[s.signatureRow, { marginTop: 12 }]}>
            <Text style={s.signatureLabel}>Kompaniya vakili (ixtiyoriy):</Text>
            <Text style={s.signatureLineEmpty}></Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
