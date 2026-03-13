import { Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "../cvPdfStyles";

export default function PdfEducationSection({ education }) {
  if (!education.length) return null;

  return (
    <>
      <Text style={pdfStyles.sectionTitle}>Ausbildung</Text>
      {education.map((edu, idx) => (
        <View key={idx} style={pdfStyles.timelineRow}>
          <Text style={pdfStyles.timelineDate}>
            {(edu?.startDate || "\u2014") + " \u2013 " + (edu?.endDate || "\u2014")}
          </Text>
          <View style={{ flex: 1 }}>
            <Text>{edu?.institution || "\u2014"}</Text>
            <Text style={pdfStyles.italic}>
              Abschluss: {edu?.degree || "\u2014"}
            </Text>
          </View>
        </View>
      ))}
    </>
  );
}
