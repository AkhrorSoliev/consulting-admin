import { Text, View } from "@react-pdf/renderer";
import s from "./styles";

export default function ErklaerungUndUnterschrift({ datum }) {
  return (
    <>
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
    </>
  );
}
