import { Page, Text, View } from "@react-pdf/renderer";
import { s, hasValue } from "./styles";

export default function VollmachtPage({ form }) {
  const lastName = String(form?.lastName || "").trim();
  const firstName = String(form?.firstName || "").trim();
  const birthDate = String(form?.birthDate || "").trim();
  const city = String(form?.city || "").trim();
  const date = String(form?.date || "").trim();

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.title}>Vollmacht</Text>

      <Text style={s.p}>Hiermit bevollm\u00E4chtige ich</Text>

      <View style={{ marginLeft: 20, marginTop: 8 }}>
        <View style={s.formRow}>
          <Text style={s.formLabel}>Nachname:</Text>
          {hasValue(lastName) ? (
            <Text style={{ flex: 1 }}>{lastName}</Text>
          ) : (
            <View style={s.formUnderline} />
          )}
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>Vorname:</Text>
          {hasValue(firstName) ? (
            <Text style={{ flex: 1 }}>{firstName}</Text>
          ) : (
            <View style={s.formUnderline} />
          )}
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>geboren am:</Text>
          {hasValue(birthDate) ? (
            <Text style={{ flex: 1 }}>{birthDate}</Text>
          ) : (
            <View style={s.formUnderline} />
          )}
        </View>
      </View>

      <Text style={[s.p, { marginTop: 16 }]}>den Vollmachtnehmer</Text>

      <Text style={[s.p, s.bold, { marginTop: 8 }]}>
        Orif Akhmadaliev, (ConsultingUz), Alemannenweg 6, 72488 Sigmaringen
      </Text>

      <Text style={[s.p, { marginTop: 12 }]}>
        mich zu unterst\u00FCtzen und zu vertreten in der Angelegenheit Erlangung
        und Antritt einer Fachkraft in Deutschland.
      </Text>

      <Text style={[s.p, { marginTop: 12 }]}>
        Die Vollmacht umfasst insbesondere
      </Text>

      <View style={s.list}>
        <View style={s.liRow}>
          <Text style={s.liDash}>{"\u2022"}</Text>
          <Text>
            die Vertretung bei allen erforderlichen Ma\u00DFnahmen gegen\u00FCber
            Beh\u00F6rden und Intuitionen, um eine Fachkraft in Deutschland
            antreten zu k\u00F6nnen,
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>{"\u2022"}</Text>
          <Text>die Einholung von beglaubigten \u00DCbersetzungen,</Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>{"\u2022"}</Text>
          <Text>
            die Versendung und Entgegennahme von Schriftst\u00FCcken sowie die
            Abgabe und Entgegennahme von m\u00FCndlichen Erkl\u00E4rungen im Rahmen der
            vorgenannten T\u00E4tigkeiten ist ausdr\u00FCcklich eingeschlossen.
          </Text>
        </View>
      </View>

      <View style={s.sigRow}>
        <View style={{ marginLeft: 20 }}>
          <View style={s.formRow}>
            <Text style={s.formLabel}>Wohnort:</Text>
            {hasValue(city) ? (
              <Text style={{ flex: 1 }}>{city}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={s.formRow}>
            <Text style={s.formLabel}>Datum:</Text>
            {hasValue(date) ? (
              <Text style={{ flex: 1 }}>{date}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>

          <View style={[s.formRow, { marginTop: 20 }]}>
            <Text style={s.formLabel}>Unterschrift:</Text>
            <View style={s.formUnderline} />
          </View>
        </View>
      </View>
    </Page>
  );
}
