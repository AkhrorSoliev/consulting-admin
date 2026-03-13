import { Text, View } from "@react-pdf/renderer";
import s from "./styles";

export default function PersoenlicheAngaben({
  nachname,
  vorname,
  wohnadresseDeutschland,
  wohnadresseUsbekistan,
  geburtsdatum,
  geburtsort,
  geschlecht,
  staatsangehoerigkeit,
  schuhgroesse,
  kleidergroesse,
}) {
  return (
    <>
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
    </>
  );
}
