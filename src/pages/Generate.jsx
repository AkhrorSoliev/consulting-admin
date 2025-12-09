import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { FaDownload, FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  Link as PdfLink,
  pdf,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Mulish",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNRwaA.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/mulish/v18/1Ptwg83HX_SGhgqk2hAjQlW_mEuZ0FsSKeOvHg.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexaFRwaA.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexU1WwaA.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/mulish/v18/1Ptyg83HX_SGhgqO0yLcmjzUAuWexXRWwaA.ttf",
      fontWeight: 700,
    },
  ],
});
import FormInput from "../components/FormInput";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import {
  imageFileToBase64,
  toInputDate,
  fromInputDate,
  generateSkills,
  updateDocument,
} from "../utils";

function Generate() {
  const { major, id } = useParams();
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Local editable state (Create.jsx like)
  const initialForm = useMemo(
    () => ({
      personalInfo: {
        name: "",
        address: "",
        birthDate: "",
        maritalStatus: "",
        phone: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
      documents: { diplomas: [], certificates: [] },
    }),
    []
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [showDocuments, setShowDocuments] = useState(true);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          setDocCv(data);
          setNotFound(false);
          if (!formInitialized) {
            setFormCv(mapDocToForm(data));
            setFormInitialized(true);
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [major, id, formInitialized]);

  function mapDocToForm(data) {
    const p = data?.persoenlicheDaten || {};
    const berufe = Array.isArray(data?.berufserfahrung)
      ? data.berufserfahrung
      : [];
    const ausb = Array.isArray(data?.ausbildung) ? data.ausbildung : [];
    const f = data?.faehigkeiten || {};
    const d = data?.dokumente || {};
    const att = data?.attachments || {};

    let diplomas = [];
    if (Array.isArray(d?.diplome)) {
      diplomas = d.diplome;
    } else if (Array.isArray(att?.diplomas)) {
      diplomas = att.diplomas;
    }

    let certificates = [];
    if (Array.isArray(d?.zertifikate)) {
      certificates = d.zertifikate;
    } else if (Array.isArray(att?.languageCertificates)) {
      certificates = att.languageCertificates;
    }

    return {
      personalInfo: {
        name: String(p.name || ""),
        address: String(p.adresse || ""),
        birthDate: String(p.geburtsdatum || ""),
        maritalStatus: String(p.familienstand || ""),
        phone: String(p.telefon || ""),
        email: String(p.email || ""),
        photo: String(p.foto || ""),
      },
      experience: berufe.map((b) => ({
        startDate: String(b?.beginn || ""),
        endDate: String(b?.ende || ""),
        position: String(b?.position || ""),
        company: String(b?.unternehmen || ""),
        location: String(b?.ort || ""),
        responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
      })),
      education: ausb.map((a) => ({
        startDate: String(a?.beginn || ""),
        endDate: String(a?.ende || ""),
        institution: String(a?.bildungseinrichtung || ""),
        degree: String(a?.abschluss || ""),
      })),
      skills: {
        softSkills: Array.isArray(f?.sozialkompetenzen)
          ? f.sozialkompetenzen
          : [],
        pcSkills: Array.isArray(f?.pcKenntnisse) ? f.pcKenntnisse : [],
        languages:
          typeof f?.sprachen === "object" && f?.sprachen !== null
            ? f.sprachen
            : {},
      },
      documents: {
        diplomas,
        certificates,
      },
    };
  }

  function mapFormToDoc(f) {
    return {
      persoenlicheDaten: {
        name: f.personalInfo.name,
        adresse: f.personalInfo.address,
        geburtsdatum: f.personalInfo.birthDate,
        familienstand: f.personalInfo.maritalStatus,
        telefon: f.personalInfo.phone,
        email: f.personalInfo.email,
        foto: f.personalInfo.photo,
      },
      berufserfahrung: Array.isArray(f.experience)
        ? f.experience.map((exp) => ({
            beginn: exp.startDate,
            ende: exp.endDate,
            position: exp.position,
            unternehmen: exp.company,
            ort: exp.location,
            aufgaben: Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : [],
          }))
        : [],
      ausbildung: Array.isArray(f.education)
        ? f.education.map((edu) => ({
            beginn: edu.startDate,
            ende: edu.endDate,
            bildungseinrichtung: edu.institution,
            abschluss: edu.degree || "",
          }))
        : [],
      faehigkeiten: {
        sozialkompetenzen: f.skills?.softSkills || [],
        pcKenntnisse: f.skills?.pcSkills || [],
        sprachen: f.skills?.languages || {},
      },
      dokumente: {
        diplome: f.documents?.diplomas || [],
        zertifikate: f.documents?.certificates || [],
      },
    };
  }

  // PDF styles for consistent export layout
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

  const CvPdfDocument = ({ form, showDocuments }) => {
    const personal = form?.personalInfo || {};
    const fullName = String(personal.name || "").trim() || "—";
    const address = String(personal.address || "").trim() || "—";
    const birthDate = String(personal.birthDate || "").trim() || "—";
    const maritalStatus = String(personal.maritalStatus || "").trim() || "—";
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
                    {(exp?.startDate || "—") +
                      " – " +
                      (exp?.endDate || "heute")}
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
              <Text style={pdfStyles.sectionTitle}>
                Kenntnisse & Fähigkeiten
              </Text>
              <View style={{ gap: 12 }}>
                {Array.isArray(skills.softSkills) &&
                skills.softSkills.length > 0 ? (
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

                {Array.isArray(skills.pcSkills) &&
                skills.pcSkills.length > 0 ? (
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

          {(showDocuments && (documents?.diplomas?.length > 0 ||
            documents?.certificates?.length > 0)) && (
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

  async function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: base64 },
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Experience handlers
  function addExperience() {
    setFormCv((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ],
    }));
  }
  function updateExperience(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: next };
    });
  }
  function removeExperience(idx) {
    setFormCv((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  }
  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  // Education handlers
  function addEducation() {
    setFormCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }
  function updateEducation(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: next };
    });
  }
  function removeEducation(idx) {
    setFormCv((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  }

  // Skills handlers
  function addTag(path, value) {
    if (!value?.trim()) return;
    setFormCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }
  function removeTag(path, index) {
    setFormCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }
  async function autoAddSkills(kind) {
    if (kind === "soft") setIsGeneratingSoft(true);
    else setIsGeneratingPc(true);
    try {
      const generated = generateSkills(formCv, kind);
      if (generated.length) {
        if (kind === "soft") {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              softSkills: [...prev.skills.softSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, soft: generated }));
        } else {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              pcSkills: [...prev.skills.pcSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, pc: generated }));
        }
      } else {
        setRecentlyAdded((p) =>
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] }
        );
      }
    } finally {
      if (kind === "soft") setIsGeneratingSoft(false);
      else setIsGeneratingPc(false);
    }
  }

  // Languages handlers
  const languageRows = useMemo(
    () =>
      Object.entries(formCv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [formCv.skills.languages]
  );
  function addLanguageRow() {
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }
  function updateLanguageRow(rowIdx, field, value) {
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let next = [...entries];
      if (field === "name") next[rowIdx] = [value, oldLevel];
      else next[rowIdx] = [oldName, value];
      const nextObj = Object.fromEntries(
        next.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }
  function removeLanguageRow(rowIdx) {
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function handleSave() {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    try {
      setIsSaving(true);
      const payload = mapFormToDoc(formCv);
      await updateDocument(col, docId, payload);
      toast.success("Änderungen wurden gespeichert.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const personName = String(formCv.personalInfo.name || "").trim();
      const fileBase = personName ? `Lebenslauf ${personName}` : "Lebenslauf";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Lebenslauf";
      const blob = await pdf(<CvPdfDocument form={formCv} showDocuments={showDocuments} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const SectionTitle = ({ children }) => (
    <div className="mt-8 mb-3">
      <h3 className="text-xl font-semibold">{children}</h3>
      <div className="h-[2px] bg-base-300 mt-1" />
    </div>
  );

  // Preview data from form state
  const fullName = String(formCv.personalInfo.name || "").trim() || "—";
  const address = String(formCv.personalInfo.address || "").trim();
  const birthDate = String(formCv.personalInfo.birthDate || "").trim();
  const phone = String(formCv.personalInfo.phone || "").trim();
  const email = String(formCv.personalInfo.email || "").trim();
  const maritalStatus = String(formCv.personalInfo.maritalStatus || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  // Shared DaisyUI input styles for the edit form
  const inputBase = "input input-bordered w-full";
  const selectBase = "select select-bordered w-full";
  const textareaBase = "textarea textarea-bordered w-full";
  const fileInputBase =
    "file-input file-input-bordered file-input-primary w-full";

  // Style overrides for FormInput component

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-base-200 min-h-screen">
      <div className="w-full">
        {/* Controls (hidden on print) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link
                  to={`/collectionCv/${major}`}
                  className="link flex items-center gap-2"
                >
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">CV</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={handleDownloadPdf}
              disabled={loading || notFound || isDownloading}
            >
              <FaDownload /> {isDownloading ? "Wird geladen..." : "Herunterladen"}
            </button>
            <button
              className={`btn btn-sm btn-primary ${
                isSaving ? "btn-disabled" : ""
              }`}
              onClick={handleSave}
              disabled={isSaving || loading || notFound}
            >
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : notFound ? (
          <div className="py-16 text-center bg-base-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
            <p className="opacity-70">
              Das Dokument existiert nicht oder wurde gelöscht.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
            <section className="card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto">
              <div className="card-body space-y-3">
                <h2 className="card-title text-2xl font-bold">
                  Daten bearbeiten
                </h2>
                <div className="divider mt-2">Persönliche Daten</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Name"
                    placeholder="Name"
                    value={formCv.personalInfo.name}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          name: e.target.value,
                        },
                      }))
                    }
                  />
                  <FormInput
                    label="Geburtsdatum"
                    type="date"
                    value={toInputDate(formCv.personalInfo.birthDate)}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          birthDate: fromInputDate(e.target.value),
                        },
                      }))
                    }
                  />
                  <div className="form-control w-full">
                    <label className="label" htmlFor="g-marital">
                      <span className="label-text">Familienstand</span>
                    </label>
                    <select
                      id="g-marital"
                      className={selectBase}
                      value={formCv.personalInfo.maritalStatus}
                      onChange={(e) =>
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            maritalStatus: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Bitte auswählen</option>
                      <option value="ledig">ledig</option>
                      <option value="verheiratet">verheiratet</option>
                    </select>
                  </div>
                  <FormInput
                    label="Telefonnummer"
                    placeholder="Telefonnummer"
                    value={formCv.personalInfo.phone}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          phone: e.target.value,
                        },
                      }))
                    }
                  />
                  <FormInput
                    label="E-Mail"
                    placeholder="E-Mail"
                    type="email"
                    value={formCv.personalInfo.email}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          email: e.target.value,
                        },
                      }))
                    }
                  />

                  <div className="md:col-span-2 form-control w-full">
                    <label className="label pb-1" htmlFor="g-photo-file">
                      <span className="label-text font-medium">
                        Foto hochladen (JPEG/PNG)
                      </span>
                    </label>
                    <input
                      id="g-photo-file"
                      type="file"
                      accept="image/*"
                      className={fileInputBase}
                      onChange={handlePhotoFileChange}
                    />
                  </div>

                  <div className="md:col-span-2 form-control w-full">
                    <label className="label pb-1" htmlFor="g-address">
                      <span className="label-text font-medium">Adresse</span>
                    </label>
                    <textarea
                      id="g-address"
                      className={textareaBase}
                      placeholder="Adresse"
                      rows={2}
                      value={formCv.personalInfo.address}
                      onChange={(e) =>
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            address: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="divider">Berufserfahrung</div>
                <ExperienceSection
                  experience={formCv.experience}
                  onAddExperience={addExperience}
                  onUpdateExperience={updateExperience}
                  onRemoveExperience={removeExperience}
                  onAddResponsibility={addResponsibility}
                  onRemoveResponsibility={removeResponsibility}
                />

                <div className="divider">Ausbildung</div>
                <EducationSection
                  education={formCv.education}
                  onAddEducation={addEducation}
                  onUpdateEducation={updateEducation}
                  onRemoveEducation={removeEducation}
                />

                <div className="divider">Fähigkeiten</div>
                <SkillsSection
                  softSkills={formCv.skills.softSkills}
                  pcSkills={formCv.skills.pcSkills}
                  onAddSoft={(val) => addTag(["skills", "softSkills"], val)}
                  onRemoveSoft={(i) => removeTag(["skills", "softSkills"], i)}
                  onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
                  onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
                  onAutoAddSoft={() => autoAddSkills("soft")}
                  onAutoAddPc={() => autoAddSkills("pc")}
                  isGeneratingSoft={isGeneratingSoft}
                  isGeneratingPc={isGeneratingPc}
                  recentlyAddedSoft={recentlyAdded.soft}
                  recentlyAddedPc={recentlyAdded.pc}
                />

                <div className="divider">Sprachen</div>
                <LanguagesSection
                  languageRows={languageRows}
                  onAddRow={addLanguageRow}
                  onUpdateRow={updateLanguageRow}
                  onRemoveRow={removeLanguageRow}
                />

                <div className="divider">Dokumente</div>
                
                <div className="form-control mb-4">
                  <label className="label cursor-pointer justify-start gap-3">
                    <span className="label-text font-semibold">
                      Dokumente im PDF anzeigen
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={showDocuments}
                      onChange={(e) => setShowDocuments(e.target.checked)}
                    />
                  </label>
                </div>

                {/* Diplomas */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">Diplome</h4>
                  <div className="flex flex-col gap-2">
                    {(!formCv.documents?.diplomas || formCv.documents.diplomas.length === 0) ? (
                      <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                        Keine Diplome vorhanden.
                      </div>
                    ) : (
                      formCv.documents.diplomas.map((url, i) => (
                        <div key={i} className="flex gap-2 items-center p-2 bg-base-100 border rounded">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary text-sm truncate flex-1"
                          >
                            {url}
                          </a>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-square btn-sm btn-ghost text-primary"
                            title="Link öffnen"
                          >
                            <FaExternalLinkAlt />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Certificates */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">Zertifikate</h4>
                  <div className="flex flex-col gap-2">
                    {(!formCv.documents?.certificates || formCv.documents.certificates.length === 0) ? (
                      <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                        Keine Zertifikate vorhanden.
                      </div>
                    ) : (
                      formCv.documents.certificates.map((url, i) => (
                        <div key={i} className="flex gap-2 items-center p-2 bg-base-100 border rounded">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary text-sm truncate flex-1"
                          >
                            {url}
                          </a>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-square btn-sm btn-ghost text-primary"
                            title="Link öffnen"
                          >
                            <FaExternalLinkAlt />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="divider"></div>
                <div className="flex justify-end gap-2">
                  <button
                    className={`btn btn-primary ${
                      isSaving ? "btn-disabled" : ""
                    }`}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Speichern..." : "Speichern"}
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Live Preview (WYSIWYG) */}
            <section className="hidden lg:block flex-1 min-w-0 h-[calc(100vh-2rem)] sticky top-4">
              <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner h-full flex flex-col overflow-hidden">
                <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider z-10">
                  <span>Vorschau (A4)</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live-Aktualisierung
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto flex justify-center bg-slate-100">
                  <div
                    className="w-full bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[44pt] text-[#0f172a] text-[11pt] leading-[1.38] origin-top"
                    style={{
                      fontFamily: "Mulish, Helvetica, Arial, sans-serif",
                    }}
                  >
                    {/* Header */}
                    <div className="mb-[18pt]">
                      <h1 className="text-[24pt] font-bold text-[#0f172a] leading-tight">
                        {fullName}
                      </h1>
                      <div className="h-[2pt] bg-[#1f2937] mt-[17pt] mb-[12pt] w-full" />

                      <div className="flex flex-row gap-[22pt]">
                        <div className="flex-1">
                          <div className="flex flex-col gap-[6pt] mt-1">
                            <PreviewInfoRow label="Name" value={fullName} />
                            <PreviewInfoRow label="Anschrift" value={address} />
                            <PreviewInfoRow label="geb." value={birthDate} />
                            <PreviewInfoRow
                              label="Familienstand"
                              value={maritalStatus}
                            />
                            <PreviewInfoRow label="Tel" value={phone} />
                            <PreviewInfoRow label="E-Mail" value={email} />
                          </div>
                        </div>

                        <div className="shrink-0">
                          {photo ? (
                            <img
                              src={photo}
                              alt="Foto"
                              className="w-[128pt] h-[160pt] object-cover border border-[#d9dee3] rounded-[8pt]"
                            />
                          ) : (
                            <div className="w-[128pt] h-[160pt] border border-[#d9dee3] rounded-[8pt] flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                              Foto
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Berufliche Laufbahn */}
                    {formCv.experience.length > 0 && (
                      <>
                        <PreviewSectionTitle>
                          Berufliche Laufbahn
                        </PreviewSectionTitle>
                        <div className="flex flex-col gap-[10pt]">
                          {formCv.experience.map((exp, i) => (
                            <div key={i} className="flex flex-row gap-[10pt]">
                              <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                                {(exp.startDate || "—") +
                                  " – " +
                                  (exp.endDate || "heute")}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-[#0f172a]">
                                  {exp.position || "—"}
                                  {exp.location ? `, ${exp.location}` : ""}
                                </div>
                                {exp.company && (
                                  <div className="italic text-[#475569]">
                                    {exp.company}
                                  </div>
                                )}
                                {Array.isArray(exp.responsibilities) &&
                                  exp.responsibilities.length > 0 && (
                                    <div className="mt-[4pt]">
                                      {exp.responsibilities.map((r, ri) => (
                                        <div
                                          key={ri}
                                          className="flex flex-row gap-[6pt]"
                                        >
                                          <span>•</span>
                                          <span>{r}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Ausbildung */}
                    {formCv.education.length > 0 && (
                      <>
                        <PreviewSectionTitle>Ausbildung</PreviewSectionTitle>
                        <div className="flex flex-col gap-[10pt]">
                          {formCv.education.map((edu, i) => (
                            <div key={i} className="flex flex-row gap-[10pt]">
                              <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                                {(edu.startDate || "—") +
                                  " – " +
                                  (edu.endDate || "—")}
                              </div>
                              <div className="flex-1">
                                <div>{edu.institution || "—"}</div>
                                <div className="italic text-[#475569]">
                                  Abschluss: {edu.degree || "—"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Kenntnisse & Fähigkeiten */}
                    {(formCv.skills.softSkills?.length > 0 ||
                      Object.entries(formCv.skills.languages || {}).length >
                        0 ||
                      formCv.skills.pcSkills?.length > 0) && (
                      <>
                        <PreviewSectionTitle>
                          Kenntnisse & Fähigkeiten
                        </PreviewSectionTitle>
                        <div className="flex flex-col gap-[12pt]">
                          {formCv.skills.softSkills?.length > 0 && (
                            <div className="flex flex-col gap-[4pt]">
                              <div className="font-bold">Fähigkeiten</div>
                              <div className="flex flex-col gap-[3pt]">
                                {formCv.skills.softSkills.map((s, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-row gap-[6pt]"
                                  >
                                    <span>•</span>
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {Object.entries(formCv.skills.languages || {})
                            .length > 0 && (
                            <div className="flex flex-col gap-[4pt]">
                              <div className="font-bold">Fremdsprachen</div>
                              <div className="flex flex-col gap-[3pt]">
                                {Object.entries(formCv.skills.languages).map(
                                  ([lang, level]) => (
                                    <div
                                      key={lang}
                                      className="flex flex-row gap-[6pt]"
                                    >
                                      <span>•</span>
                                      <span>
                                        {lang} — {level}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {formCv.skills.pcSkills?.length > 0 && (
                            <div className="flex flex-col gap-[4pt]">
                              <div className="font-bold">PC-Kenntnisse</div>
                              <div className="flex flex-col gap-[3pt]">
                                {formCv.skills.pcSkills.map((s, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-row gap-[6pt]"
                                  >
                                    <span>•</span>
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Dokumente */}
                    {(showDocuments && (formCv.documents?.diplomas?.length > 0 ||
                      formCv.documents?.certificates?.length > 0)) && (
                      <>
                        <PreviewSectionTitle>Dokumente</PreviewSectionTitle>
                        <div className="flex flex-col gap-[12pt]">
                          {formCv.documents.diplomas?.length > 0 && (
                            <div className="flex flex-col gap-[4pt]">
                              <div className="font-bold">Diplome</div>
                              <div className="flex flex-col gap-[3pt]">
                                {formCv.documents.diplomas.map((url, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-row gap-[6pt]"
                                  >
                                    <span>•</span>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline break-all"
                                    >
                                      {url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {formCv.documents.certificates?.length > 0 && (
                            <div className="flex flex-col gap-[4pt]">
                              <div className="font-bold">Zertifikate</div>
                              <div className="flex flex-col gap-[3pt]">
                                {formCv.documents.certificates.map((url, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-row gap-[6pt]"
                                  >
                                    <span>•</span>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline break-all"
                                    >
                                      {url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

const PreviewInfoRow = ({ label, value }) => (
  <div className="flex flex-row items-start mb-[6pt]">
    <div className="w-[110pt] font-bold text-[#334155] shrink-0">{label}</div>
    <div className="flex-1 text-[#0f172a] ml-[4pt]">{value || "—"}</div>
  </div>
);

const PreviewSectionTitle = ({ children }) => (
  <div className="mt-[20pt] mb-[8pt] pb-[4pt] border-b border-[#e5e7eb]">
    <h3 className="text-[13pt] font-bold uppercase tracking-[0.6px] text-[#0f172a]">
      {children}
    </h3>
  </div>
);

export default Generate;
