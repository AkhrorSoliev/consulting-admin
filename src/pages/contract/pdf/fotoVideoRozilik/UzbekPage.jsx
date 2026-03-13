import {
  Link,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import s from "./styles";

export default function UzbekPage({ fullName, geburtsdatum, adresseUz, email, ortDatumUz }) {
  return (
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
  );
}
