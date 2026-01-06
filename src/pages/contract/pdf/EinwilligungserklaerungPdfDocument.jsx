import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/* ================= FONT ================= */

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
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });
}

/* ================= STYLES ================= */

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 0.8,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 600,
  },

  p: {
    marginTop: 1,
    marginBottom: 1,
    lineHeight: 0.8,
  },

  bold: { fontWeight: 700 },

  formRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },

  formLabel: {
    width: 220,
    fontWeight: 700,
  },

  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dotted",
    flex: 1,
    height: 10,
  },

  /* ===== BULLET SYSTEM ===== */

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 32,
    marginRight: 32,
    marginTop: 1,
    marginBottom: 0.1,
  },

  bulletDot: {
    width: 10,
    fontWeight: 700,
  },

  bulletText: {
    flex: 1,
    lineHeight: 1,
  },

  /* ===== SIGNATURE ===== */

  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dotted",
    height: 16,
  },
});

/* ================= HELPERS ================= */

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

function Bullet({ children }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

/* ================= DOCUMENT ================= */

export default function EinwilligungserklaerungPdfDocument({ form }) {
  ensureInterRegistered();

  const fullName = String(form?.fullName || "").trim();
  const birthDate = String(form?.birthDate || "").trim();
  const address = String(form?.address || "").trim();
  const city = String(form?.city || "").trim();
  const date = String(form?.date || "").trim();

  return (
    <Document>
      {/* ================= PAGE 1 — GERMAN ================= */}

      <Page size="A4" style={s.page}>
        <Text style={s.title}>
          Einwilligungserklärung zur Nutzung von Foto- und Videoaufnahmen
        </Text>

        <View>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Name der Person:</Text>
            {hasValue(fullName) ? (
              <Text>{fullName}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Geburtsdatum:</Text>
            {hasValue(birthDate) ? (
              <Text>{birthDate}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Adresse:</Text>
            {hasValue(address) ? (
              <Text>{address}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>
        </View>

        <Text style={s.sectionTitle}>1. Zweck der Einwilligung</Text>
        <Text style={s.p}>
          Ich willige ein, dass Orif Akhmadaliev (ConsultingUz), nachfolgend
          „Unternehmen“ genannt, Foto- und Videoaufnahmen von mir erstellt und
          diese zu folgenden Zwecken verwendet:
        </Text>

        <Bullet>
          Veröffentlichung auf Social-Media-Plattformen (Instagram, Facebook,
          LinkedIn, Telegram, YouTube)
        </Bullet>
        <Bullet>Nutzung auf der Website des Unternehmens</Bullet>
        <Bullet>
          Verwendung für Werbe-, Informations- und Marketingzwecke
        </Bullet>
        <Bullet>
          Darstellung von Erfolgsgeschichten, Erfahrungsberichten sowie
          Präsentationen
        </Bullet>

        <Text style={s.sectionTitle}>2. Art der verwendeten Medien</Text>
        <Text style={s.p}>
          Ich willige ein, dass folgende Medien genutzt werden dürfen:
        </Text>

        <Bullet>Fotos und Videos (Einzel- und Gruppenaufnahmen)</Bullet>
        <Bullet>Kurze Interviews oder Video-Statements</Bullet>

        <Text style={s.sectionTitle}>3. Umfang der Nutzung</Text>
        <Text style={s.p}>
          Die Aufnahmen dürfen weltweit, zeitlich unbegrenzt und ohne
          Einschränkung genutzt, vervielfältigt, verbreitet und öffentlich
          zugänglich gemacht werden.
        </Text>
        <Text style={s.p}>
          Die Einwilligung umfasst insbesondere die Veröffentlichung auf:
        </Text>

        <Bullet>Instagram, Facebook, LinkedIn, Telegram</Bullet>
        <Bullet>Websites: consultinguz.de / consultinguz.uz</Bullet>
        <Bullet>Sonstige digitale Kommunikationskanäle des Unternehmens</Bullet>

        <Text style={s.sectionTitle}>4. Freiwilligkeit und Widerruf</Text>
        <Text style={s.p}>
          Die Einwilligung erfolgt freiwillig. Ich kann sie jederzeit mit
          Wirkung für die Zukunft widerrufen.
        </Text>
        <Text style={s.p}>
          Ein Widerruf hat keinen Einfluss auf bereits erfolgte
          Veröffentlichungen, aber zukünftige Nutzungen werden eingestellt.
        </Text>
        <Text style={s.p}>Widerrufserklärung bitte senden an:</Text>
        <Text style={s.p}>
          <Text style={s.bold}>E-Mail:</Text> orif.ahmadaliyev@hotmail.de
        </Text>

        <Text style={s.sectionTitle}>5. Rechte an den Aufnahmen</Text>
        <Text style={s.p}>
          Ich bestätige, dass mit der Nutzung der Aufnahmen keine
          Vergütungsansprüche entstehen.
        </Text>
        <Text style={s.p}>
          Das Unternehmen darf die Aufnahmen bearbeiten, zuschneiden oder in
          Collagen verwenden, solange meine Persönlichkeitsrechte gewahrt
          bleiben.
        </Text>

        <Text style={s.sectionTitle}>6. Datenschutz</Text>
        <Text style={s.p}>
          Die Verarbeitung der Daten erfolgt gemäß der geltenden
          Datenschutzbestimmungen (DSGVO).
        </Text>
        <Text style={s.p}>
          Es werden ausschließlich die für die Veröffentlichung notwendigen
          Daten verarbeitet.
        </Text>

        <View style={{ marginTop: 20 }}>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Ort, Datum:</Text>
            {hasValue(city) || hasValue(date) ? (
              <Text>{city && date ? `${city}, ${date}` : city || date}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={[s.formRow, { marginTop: 12 }]}>
            <Text style={s.formLabel}>Unterschrift der Person:</Text>
            <View style={s.formUnderline} />
          </View>

          <View style={[s.formRow, { marginTop: 12 }]}>
            <Text style={s.formLabel}>
              Unterschrift des Unternehmens (optional):
            </Text>
            <View style={s.formUnderline} />
          </View>
        </View>
      </Page>

      {/* ================= PAGE 2 — UZBEK ================= */}

      <Page size="A4" style={s.page}>
        <Text style={s.title}>
          Foto va video tasvirlardan foydalanishga rozilik arizasi
        </Text>

        <View>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Shaxsning ismi-sharifi:</Text>
            {hasValue(fullName) ? (
              <Text>{fullName}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Tug‘ilgan sana:</Text>
            {hasValue(birthDate) ? (
              <Text>{birthDate}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Manzili:</Text>
            {hasValue(address) ? (
              <Text>{address}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>
        </View>

        <Text style={s.sectionTitle}>1. Rozilikning maqsadi</Text>
        <Text style={s.p}>
          Men Orif Akhmadaliev (ConsultingUz) tomonidan foto va video
          tasvirlarimdan quyidagi maqsadlarda foydalanishga rozilik bildiraman:
        </Text>

        <Bullet>Ijtimoiy tarmoqlarda joylashtirish</Bullet>
        <Bullet>Kompaniyaning rasmiy veb-saytida foydalanish</Bullet>
        <Bullet>Reklama va marketing maqsadlarida qo‘llash</Bullet>
        <Bullet>Muvaffaqiyat hikoyalari va taqdimotlar</Bullet>

        <Text style={s.sectionTitle}>2. Media turlari</Text>
        <Bullet>Foto va video tasvirlar</Bullet>
        <Bullet>Qisqa intervyular yoki video murojaatlar</Bullet>

        <Text style={s.sectionTitle}>3. Foydalanish doirasi</Text>
        <Text style={s.p}>
          Tasvirlardan muddatsiz va cheklovsiz foydalanishga roziman.
        </Text>

        <Bullet>Instagram, Facebook, LinkedIn, Telegram</Bullet>
        <Bullet>consultinguz.de / consultinguz.uz</Bullet>
        <Bullet>Boshqa raqamli kanallar</Bullet>

        <Text style={s.sectionTitle}>4. Bekor qilish huquqi</Text>
        <Text style={s.p}>
          Rozilik istalgan vaqtda kelajak uchun bekor qilinishi mumkin.
        </Text>

        <Text style={s.p}>
          <Text style={s.bold}>E-mail:</Text> orif.akhmadaliyev@hotmail.de
        </Text>

        <Text style={s.sectionTitle}>5. Huquqlar</Text>
        <Text style={s.p}>
          Hech qanday to‘lov talab qilinmaydi. Tahrirlash shaxsiy huquqlar
          saqlangan holda amalga oshiriladi.
        </Text>

        <Text style={s.sectionTitle}>6. Ma’lumotlarni himoya qilish</Text>
        <Text style={s.p}>Ma’lumotlar DSGVO asosida qayta ishlanadi.</Text>

        <View style={{ marginTop: 20 }}>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Joy, sana:</Text>
            {hasValue(city) || hasValue(date) ? (
              <Text>{city && date ? `${city}, ${date}` : city || date}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={[s.formRow, { marginTop: 12 }]}>
            <Text style={s.formLabel}>Imzo:</Text>
            <View style={s.sigUnderline} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
