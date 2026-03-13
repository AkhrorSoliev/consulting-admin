import { Text, View } from "@react-pdf/renderer";
import s from "./styles";

export default function FinanzUndVisadaten({
  steueridentifikationsnummer,
  krankenversicherung,
  bankName,
  iban,
  bic,
  visaArt,
  visaNummer,
  visaGueltigkeit,
}) {
  return (
    <>
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
    </>
  );
}
