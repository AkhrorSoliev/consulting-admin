import { Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "../cvPdfStyles";

export default function PdfExperienceSection({ experience }) {
  if (!experience.length) return null;

  return (
    <>
      <Text style={pdfStyles.sectionTitle}>Berufliche Laufbahn</Text>
      {experience.map((exp, idx) => (
        <View key={idx} style={pdfStyles.timelineRow}>
          <Text style={pdfStyles.timelineDate}>
            {(exp?.startDate || "\u2014") + " \u2013 " + (exp?.endDate || "heute")}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.itemTitle}>
              {(exp?.position || "\u2014") +
                (exp?.location ? `, ${exp.location}` : "")}
            </Text>
            {exp?.company ? (
              <Text style={pdfStyles.italic}>{exp.company}</Text>
            ) : null}
            {Array.isArray(exp?.responsibilities) &&
            exp.responsibilities.length ? (
              <View style={{ marginTop: 4 }}>
                {exp.responsibilities.map((r, i) => (
                  <View key={i} style={pdfStyles.bulletRow}>
                    <Text>{"\u2022"}</Text>
                    <Text>{r}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </>
  );
}
