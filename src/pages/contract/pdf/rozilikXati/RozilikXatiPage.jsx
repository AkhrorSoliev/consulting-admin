import { Page, Text, View } from "@react-pdf/renderer";
import { s, hasValue } from "./styles";

export default function RozilikXatiPage({ form }) {
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
  );
}
