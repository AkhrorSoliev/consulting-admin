import { Text, View } from "@react-pdf/renderer";
import s from "./styles";
import { hasValue } from "./utils";

export default function VollmachtTextBody({
  employerDisplayName,
  employerRepDisplayName,
}) {
  return (
    <>
      <Text style={s.subtitle}>
        Vollmacht für die Beantragung eines beschleunigten
        Fachkräfteverfahrens
      </Text>

      <Text style={s.p}>
        Hiermit bevollmächtige ich{" "}
        {hasValue(employerDisplayName) ? (
          <Text style={s.bold}>{employerDisplayName}</Text>
        ) : (
          <Text style={s.placeholderText}>____________________</Text>
        )}
      </Text>

      <Text style={s.p}>- im Folgenden: „der Bevollmächtigte",</Text>

      <Text style={[s.p, { textAlign: "justify" }]}>
        vertreten durch{" "}
        {hasValue(employerRepDisplayName) ? (
          <Text style={s.bold}>{employerRepDisplayName}</Text>
        ) : (
          <Text style={s.placeholderText}>____________________</Text>
        )}{" "}
        - Vollmacht, aus der sich deren Vertretungsbefugnis für den
        Arbeitgeber ergibt, muss als Anlage beigefügt werden, bei der
        zuständigen Ausländerbehörde das beschleunigte Fachkräfteverfahren
        nach § 81a AufenthG sowie die sonstigen ggf. damit zusammenhängenden
        und in § 81a Absatz 3 AufenthG aufgeführten Verfahren zu beantragen,
        und mich in diesen Verfahren bezüglich aller gesetzlich zulässigen
        Angelegenheiten außergerichtlich zu vertreten.
      </Text>

      <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
        Ich erteile dem Bevollmächtigten die Befugnis, sämtliche Erklärungen
        und Handlungen verbindlich vorzunehmen, die nach den gesetzlichen
        Regelungen vorgenommen werden können und für die Verfahren
        erforderlich sind.
      </Text>

      <Text style={[s.p, { marginTop: 10 }]}>
        Der Umfang der Vertretungsbefugnis beinhaltet insbesondere
      </Text>

      <View style={s.list}>
        <View style={s.liRow}>
          <Text style={s.liDash}>•</Text>
          <Text style={{ flex: 1, textAlign: "justify" }}>
            die Vertretung in allen für die Durchführung des beschleunigten
            Fachkräfteverfahrens erforderlichen Angelegenheiten gegenüber der
            zuständigen Ausländerbehörde, der für die berufliche Anerkennung
            zuständigen Stelle sowie der ggf. sonstigen zuständigen Behörden,
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>•</Text>
          <Text style={{ flex: 1, textAlign: "justify" }}>
            das Ein- und Nachreichen der für die Verfahren erforderlichen
            Unterlagen einschließlich meiner personenbezogenen Daten,
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>•</Text>
          <Text style={{ flex: 1, textAlign: "justify" }}>
            die Vornahme von Zahlungen von für den Abschluss der Verfahren
            erforderlichen Gebühren,
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>•</Text>
          <Text style={{ flex: 1, textAlign: "justify" }}>
            die Entgegennahme der die Verfahren betreffenden schriftlichen
            sowie elektronischen Unterlagen, die Durchführung des
            Schriftverkehrs und das Öffnen der an mich adressierten Post und
          </Text>
        </View>
        <View style={s.liRow}>
          <Text style={s.liDash}>•</Text>
          <Text style={{ flex: 1, textAlign: "justify" }}>
            den Antrag auf Aufnahme der Familienzusammenführung nach § 81a
            Absatz 4 AufenthG ins beschleunigte Fachkräfteverfahren.
          </Text>
        </View>
      </View>

      <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
        Der Bevollmächtigte ist berechtigt, eine Untervollmacht, die den
        Umfang dieser Vollmacht nicht überschreiten darf, zu erteilen und zu
        widerrufen [
        <Text style={{ fontStyle: "italic" }}>
          auf die Möglichkeit der Verwendung des Musters für die
          Untervollmacht als Anlage zu einer Vollmacht nach § 81a Abs. 1
          AufenthG wird hingewiesen
        </Text>
        ]. Die Vollmacht erlischt mit Abschluss des beschleunigten
        Fachkräfteverfahrens.
      </Text>

      <Text style={[s.p, { marginTop: 10, textAlign: "justify" }]}>
        Da diese Vollmacht meine rechtliche Möglichkeit selbst zu handeln
        nicht ausschließt, bitte ich um direkten Kontakt zu mir, sofern dies
        zur Klärung von Sachverhalten und zur Verfahrensbeschleunigung
        erforderlich erscheint.
      </Text>
    </>
  );
}
