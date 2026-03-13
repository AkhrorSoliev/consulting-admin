import { Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "../cvPdfStyles";

export default function PdfSkillsSection({
  skills,
  hasDrivingLicense,
  drivingText,
}) {
  const languagesEntries = Object.entries(skills.languages || {});
  const hasSoftSkills =
    Array.isArray(skills.softSkills) && skills.softSkills.length > 0;
  const hasPcSkills =
    Array.isArray(skills.pcSkills) && skills.pcSkills.length > 0;

  if (
    !hasSoftSkills &&
    !hasPcSkills &&
    languagesEntries.length === 0 &&
    !hasDrivingLicense
  ) {
    return null;
  }

  return (
    <>
      <Text style={pdfStyles.sectionTitle}>Kenntnisse & F&auml;higkeiten</Text>
      <View style={{ gap: 12 }}>
        {hasDrivingLicense ? (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "bold" }}>F&uuml;hrerschein</Text>
            <View style={{ gap: 3 }}>
              <View style={pdfStyles.bulletRow}>
                <Text>{"\u2022"}</Text>
                <Text>{drivingText}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {hasSoftSkills ? (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "bold" }}>F&auml;higkeiten</Text>
            <View style={{ gap: 3 }}>
              {skills.softSkills.map((s, i) => (
                <View key={i} style={pdfStyles.bulletRow}>
                  <Text>{"\u2022"}</Text>
                  <Text>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {languagesEntries.length > 0 ? (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "bold" }}>Sprachen</Text>
            <View style={{ gap: 3 }}>
              {languagesEntries.map(([lang, level]) => (
                <View key={lang} style={pdfStyles.bulletRow}>
                  <Text>{"\u2022"}</Text>
                  <Text>
                    {lang} — {String(level)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {hasPcSkills ? (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "bold" }}>PC-Kenntnisse</Text>
            <View style={{ gap: 3 }}>
              {skills.pcSkills.map((skill, i) => (
                <View key={i} style={pdfStyles.bulletRow}>
                  <Text>{"\u2022"}</Text>
                  <Text>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </>
  );
}
