import {
  Link,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import s from "./styles";

export default function GermanPage({ fullName, geburtsdatum, adresse, email, ortDatum }) {
  return (
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
  );
}
