import {
  Document,
  Font,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  Link as PdfLink,
} from "@react-pdf/renderer";

// NOTE: This file MUST match the legacy PDF layout (from the original Generate.jsx)
// so the downloaded PDF design stays exactly the same.
const pdfStyles = StyleSheet.create({
  page: {
    padding: 44,
    fontFamily: "Mulish",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.38,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "column",
    paddingBottom: 18,
    marginBottom: 12,
    borderBottomWidth: 0,
  },
  headerMainRow: {
    flexDirection: "row",
    gap: 22,
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  divider: {
    height: 2,
    backgroundColor: "#1f2937",
    marginTop: 17,
    marginBottom: 12,
  },
  photo: {
    width: 128,
    height: 160,
    borderWidth: 1,
    borderColor: "#d9dee3",
    objectFit: "cover",
    borderRadius: 8,
  },
  infoCard: { padding: 2, gap: 6 },
  infoBlock: { gap: 6, marginTop: 2 },
  label: {
    color: "#334155",
    marginRight: 12,
    fontWeight: "bold",
    width: 110,
    textAlign: "left",
  },
  value: { color: "#0f172a", flex: 1, marginLeft: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#0f172a",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 4,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  timelineDate: {
    width: 140,
    minWidth: 140,
    color: "#475569",
    fontWeight: "bold",
    flexShrink: 0,
  },
  itemTitle: { fontWeight: "bold", color: "#0f172a" },
  italic: { fontStyle: "italic", color: "#475569" },
  bulletRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "#334155",
    color: "#0f172a",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    backgroundColor: "#eef2f7",
  },
  badge: {
    backgroundColor: "#1f2937",
    color: "#f8fafc",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
});

let mulishRegistered = false;
function ensureMulishRegistered() {
  if (mulishRegistered) return;
  mulishRegistered = true;

  Font.register({
    family: "Mulish",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNRwaA.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexU1WwaA.ttf",
        fontWeight: 600,
      },
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexXRWwaA.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptwg83HX_SGhgqk2hAjQlW_mEuZ0FsSKeOvHg.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptwg83HX_SGhgqk2hAjQlW_mEuZ0FsS9-SvHg.ttf",
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: "https://fonts.gstatic.com/s/mulish/v18/1Ptwg83HX_SGhgqk2hAjQlW_mEuZ0FsSzuSvHg.ttf",
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

export const CvPdfDocument = ({ form, showDocuments }) => {
  ensureMulishRegistered();

  const personal = form?.personalInfo || {};
  const firstName = String(personal.name || "").trim();
  const lastName = String(personal.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(personal.address || "").trim() || "—";
  const birthDate = String(personal.birthDate || "").trim() || "—";
  const maritalStatus = String(personal.maritalStatus || "").trim() || "—";
  const noChildren = Boolean(personal.noChildren);
  const childrenCount = String(personal.childrenCount || "").trim();
  const childrenText =
    noChildren ? "Keine Kinder" : childrenCount ? childrenCount : "—";
  const drivingType = String(personal.drivingLicenseType || "")
    .trim()
    .toUpperCase();
  const drivingText = Boolean(personal.hasDrivingLicense)
    ? drivingType
      ? `Ja (${drivingType})`
      : "Ja"
    : "Nein";
  const phone = String(personal.phone || "").trim() || "—";
  const email = String(personal.email || "").trim() || "—";
  const photo = String(personal.photo || "").trim();
  const experience = Array.isArray(form?.experience) ? form.experience : [];
  const education = Array.isArray(form?.education) ? form.education : [];
  const skills = form?.skills || {};
  const documents = form?.documents || {};
  const languagesEntries = Object.entries(skills.languages || {});

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.name}>{fullName}</Text>
          <View style={pdfStyles.divider} />
          <View style={pdfStyles.headerMainRow}>
            <View style={{ flex: 1 }}>
              <View style={[pdfStyles.infoCard, pdfStyles.infoBlock]}>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Name</Text>
                  <Text style={pdfStyles.value}>{fullName}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Anschrift</Text>
                  <Text style={pdfStyles.value}>{address}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>geb.</Text>
                  <Text style={pdfStyles.value}>{birthDate}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Familienstand</Text>
                  <Text style={pdfStyles.value}>{maritalStatus}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Kinder</Text>
                  <Text style={pdfStyles.value}>{childrenText}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Führerschein</Text>
                  <Text style={pdfStyles.value}>{drivingText}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Tel</Text>
                  <Text style={pdfStyles.value}>{phone}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>E-Mail</Text>
                  <Text style={pdfStyles.value}>{email}</Text>
                </View>
              </View>
            </View>
            <View>
              {photo ? (
                <PdfImage style={pdfStyles.photo} src={photo} />
              ) : (
                <View
                  style={[
                    pdfStyles.photo,
                    {
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#777",
                    },
                  ]}
                >
                  <Text>Foto</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {experience.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>Berufliche Laufbahn</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={pdfStyles.timelineRow}>
                <Text style={pdfStyles.timelineDate}>
                  {(exp?.startDate || "—") + " – " + (exp?.endDate || "heute")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={pdfStyles.itemTitle}>
                    {(exp?.position || "—") +
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
                          <Text>•</Text>
                          <Text>{r}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        )}

        {education.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>Ausbildung</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={pdfStyles.timelineRow}>
                <Text style={pdfStyles.timelineDate}>
                  {(edu?.startDate || "—") + " – " + (edu?.endDate || "—")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text>{edu?.institution || "—"}</Text>
                  <Text style={pdfStyles.italic}>
                    Abschluss: {edu?.degree || "—"}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {(Array.isArray(skills.softSkills) && skills.softSkills.length > 0) ||
        (Array.isArray(skills.pcSkills) && skills.pcSkills.length > 0) ||
        languagesEntries.length > 0 ? (
          <>
            <Text style={pdfStyles.sectionTitle}>Kenntnisse & Fähigkeiten</Text>
            <View style={{ gap: 12 }}>
              {Array.isArray(skills.softSkills) && skills.softSkills.length > 0 ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>Fähigkeiten</Text>
                  <View style={{ gap: 3 }}>
                    {skills.softSkills.map((s, i) => (
                      <View key={i} style={pdfStyles.bulletRow}>
                        <Text>•</Text>
                        <Text>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {languagesEntries.length > 0 ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>Fremdsprachen</Text>
                  <View style={{ gap: 3 }}>
                    {languagesEntries.map(([lang, level]) => (
                      <View key={lang} style={pdfStyles.bulletRow}>
                        <Text>•</Text>
                        <Text>
                          {lang} — {String(level)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {Array.isArray(skills.pcSkills) && skills.pcSkills.length > 0 ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>PC-Kenntnisse</Text>
                  <View style={{ gap: 3 }}>
                    {skills.pcSkills.map((skill, i) => (
                      <View key={i} style={pdfStyles.bulletRow}>
                        <Text>•</Text>
                        <Text>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {showDocuments &&
          (documents?.diplomas?.length > 0 ||
            documents?.certificates?.length > 0) && (
            <>
              <Text style={pdfStyles.sectionTitle}>Dokumente</Text>
              <View style={{ gap: 8 }}>
                {documents.diplomas?.length > 0 && (
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 10 }}>
                      Diplome
                    </Text>
                    {documents.diplomas.map((url, i) => (
                      <View key={i} style={pdfStyles.bulletRow}>
                        <Text>•</Text>
                        <PdfLink
                          src={url}
                          style={{
                            fontSize: 10,
                            color: "#2563eb",
                            textDecoration: "none",
                          }}
                        >
                          {url}
                        </PdfLink>
                      </View>
                    ))}
                  </View>
                )}
                {documents.certificates?.length > 0 && (
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 10 }}>
                      Zertifikate
                    </Text>
                    {documents.certificates.map((url, i) => (
                      <View key={i} style={pdfStyles.bulletRow}>
                        <Text>•</Text>
                        <PdfLink
                          src={url}
                          style={{
                            fontSize: 10,
                            color: "#2563eb",
                            textDecoration: "none",
                          }}
                        >
                          {url}
                        </PdfLink>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
      </Page>
    </Document>
  );
};

export default CvPdfDocument;
