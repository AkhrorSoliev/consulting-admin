import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaDownload,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  Document,
  Font,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  Link as PdfLink,
  pdf,
} from "@react-pdf/renderer";
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
import CandidateStatusStepper from "../components/CandidateStatusStepper";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
} from "../constants/candidateStatus";
import { buildStatusEmailTemplate } from "../utils/statusEmail";
import { sendBrevoEmail } from "../utils/brevo";
import RichTextEditor from "../components/RichTextEditor";

const EMPLOYER_INTERVIEW_STATUS = "employer_interview_scheduled";
const EMPLOYER_DECISION_STATUS = "employer_decision";

function Generate() {
  const { major, id } = useParams();
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [pendingInterviewStep, setPendingInterviewStep] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    dateTime: "",
    location: "",
    items: "",
  });
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [pendingDecisionStep, setPendingDecisionStep] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    decision: "accepted",
    note: "",
  });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");

  // Local editable state (Create.jsx like)
  const initialForm = useMemo(
    () => ({
      personalInfo: {
        name: "",
        lastName: "",
        gender: "",
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
      commentar: "",
    }),
    []
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [userRole, setUserRole] = useState(null);
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });

  function normalizeForm(form) {
    const safe = form || initialForm;
    const langEntries = Object.entries(safe?.skills?.languages || {}).filter(
      ([key]) => key !== undefined && key !== null
    );
    langEntries.sort(([a], [b]) =>
      String(a || "").localeCompare(String(b || ""), undefined, {
        sensitivity: "base",
      })
    );

    return {
      personalInfo: {
        name: String(safe?.personalInfo?.name || ""),
        lastName: String(safe?.personalInfo?.lastName || ""),
        gender: String(safe?.personalInfo?.gender || ""),
        address: String(safe?.personalInfo?.address || ""),
        birthDate: String(safe?.personalInfo?.birthDate || ""),
        maritalStatus: String(safe?.personalInfo?.maritalStatus || ""),
        phone: String(safe?.personalInfo?.phone || ""),
        email: String(safe?.personalInfo?.email || ""),
        photo: String(safe?.personalInfo?.photo || ""),
      },
      experience: Array.isArray(safe?.experience)
        ? safe.experience.map((exp) => ({
            startDate: String(exp?.startDate || ""),
            endDate: String(exp?.endDate || ""),
            position: String(exp?.position || ""),
            company: String(exp?.company || ""),
            location: String(exp?.location || ""),
            responsibilities: Array.isArray(exp?.responsibilities)
              ? exp.responsibilities.map((r) => String(r || ""))
              : [],
          }))
        : [],
      education: Array.isArray(safe?.education)
        ? safe.education.map((edu) => ({
            startDate: String(edu?.startDate || ""),
            endDate: String(edu?.endDate || ""),
            institution: String(edu?.institution || ""),
            degree: String(edu?.degree || ""),
          }))
        : [],
      skills: {
        softSkills: Array.isArray(safe?.skills?.softSkills)
          ? safe.skills.softSkills.map((s) => String(s || ""))
          : [],
        pcSkills: Array.isArray(safe?.skills?.pcSkills)
          ? safe.skills.pcSkills.map((s) => String(s || ""))
          : [],
        languages: Object.fromEntries(
          langEntries.map(([k, v]) => [String(k), v])
        ),
      },
      documents: {
        diplomas: Array.isArray(safe?.documents?.diplomas)
          ? safe.documents.diplomas.map((d) => String(d || ""))
          : [],
        certificates: Array.isArray(safe?.documents?.certificates)
          ? safe.documents.certificates.map((c) => String(c || ""))
          : [],
      },
      commentar: String(safe?.commentar || ""),
    };
  }

  useEffect(() => {
    let active = true;
    async function loadRole() {
      if (!user) {
        if (active) setUserRole(null);
        return;
      }
      try {
        const token = await user.getIdTokenResult();
        if (active) setUserRole(token?.claims?.role || null);
      } catch (err) {
        console.error(err);
        if (active) setUserRole(null);
      }
    }
    loadRole();
    return () => {
      active = false;
    };
  }, [user]);

  const isLimitedAdmin = userRole === "limited_admin";
  const hasComment = useMemo(
    () => hasRichTextContent(formCv.commentar),
    [formCv.commentar]
  );
  const commentChanged = useMemo(
    () => String(formCv.commentar || "") !== String(commentBaseline || ""),
    [formCv.commentar, commentBaseline]
  );

  const normalizedDocForm = useMemo(() => {
    if (!docCv) return null;
    return normalizeForm(mapDocToForm(docCv));
  }, [docCv]);

  const normalizedCurrentForm = useMemo(() => normalizeForm(formCv), [formCv]);

  const hasUnsavedChanges = useMemo(() => {
    if (!normalizedDocForm) return false;
    return (
      JSON.stringify(normalizedDocForm) !==
      JSON.stringify(normalizedCurrentForm)
    );
  }, [normalizedDocForm, normalizedCurrentForm]);

  function handleCancel() {
    if (!docCv) return;
    const mapped = mapDocToForm(docCv);
    setFormCv(mapped);
    setCommentBaseline(mapped.commentar || "");
    setIsCommentEditorOpen(false);
    setRecentlyAdded({ soft: [], pc: [] });
  }

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
          const status = data?.status || {};
          setStatusValue(status?.value || CANDIDATE_STATUS_DEFAULT);
          setStatusUpdatedAt(status?.updatedAt || null);
          setStatusUpdatedBy(status?.updatedBy || "");
          setDocCv(data);
          const cMeta = data?.commentarMeta || {};
          setCommentMeta({
            updatedAt: cMeta?.updatedAt || null,
            updatedByName: cMeta?.updatedByName || "",
            updatedByPhoto: cMeta?.updatedByPhoto || "",
            updatedByUid: cMeta?.updatedByUid || "",
          });
          setNotFound(false);
          if (!formInitialized) {
            const mapped = mapDocToForm(data);
            setFormCv(mapped);
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
        lastName: String(p.nachname || ""),
        gender: String(p.geschlecht || ""),
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
      commentar: String(data?.commentar || ""),
    };
  }

  function mapFormToDoc(f) {
    return {
      persoenlicheDaten: {
        name: f.personalInfo.name,
        nachname: f.personalInfo.lastName,
        geschlecht: f.personalInfo.gender,
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
      commentar: String(f.commentar || ""),
    };
  }

  function hasRichTextContent(value) {
    return Boolean(
      String(value || "")
        .replace(/<[^>]*>/g, "")
        .trim()
    );
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

  const CvPdfDocument = ({ form, showDocuments }) => {
    const personal = form?.personalInfo || {};
    const firstName = String(personal.name || "").trim();
    const lastName = String(personal.lastName || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
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

  async function handlePhotoFileChange(e) {
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: next };
    });
  }
  function removeExperience(idx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  }
  function addResponsibility(expIdx, text) {
    if (isLimitedAdmin) return;
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }
  function updateEducation(idx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: next };
    });
  }
  function removeEducation(idx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  }

  // Skills handlers
  function addTag(path, value) {
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }
  function updateLanguageRow(rowIdx, field, value) {
    if (isLimitedAdmin) return;
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
    if (isLimitedAdmin) return;
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

  async function persistStatus(targetValue, { silent = false } = {}) {
    if (isLimitedAdmin) {
      toast.error("Sizda status o'zgartirish huquqi yo'q.");
      return false;
    }
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return false;

    try {
      setIsSavingStatus(true);
      const now = Date.now();
      const statusMeta = getCandidateStatus(targetValue);
      await updateDocument(col, docId, {
        status: {
          value: targetValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(targetValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      if (!silent) {
        toast.success("Status saqlandi.");
      }
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error("Statusni saqlashda xato.");
      }
      return false;
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleStatusSave() {
    await persistStatus(statusValue, { silent: false });
  }

  function getNextStepValue(value) {
    const steps = CANDIDATE_STATUS_OPTIONS;
    const idx = steps.findIndex((s) => s.value === value);
    if (idx === -1) return null;
    return steps[idx + 1]?.value || null;
  }

  async function sendStatusEmail(
    stepValue,
    { interviewDetails, employerDecision, decisionNote } = {}
  ) {
    if (isLimitedAdmin) {
      toast.error("Sizda email yuborish huquqi yo'q.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("Faqat joriy bosqich uchun email yuborish mumkin.");
      return;
    }
    if (stepValue === EMPLOYER_DECISION_STATUS && !employerDecision) {
      toast.error("Qarorni (qabul yoki rad) tanlang.");
      return;
    }
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    if (!recipientEmail) {
      toast.error("Kandidat email manzili topilmadi.");
      return;
    }

    setSendingStepValue(stepValue);

    try {
      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stepValue,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        interviewDetails,
        employerDecision,
        decisionNote,
      });
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      });
      if (res?.success === false) {
        throw new Error("Email yuborilmadi (success=false).");
      }

      toast.success("Status bo'yicha email yuborildi.");

      const nextValue = getNextStepValue(stepValue) || stepValue;
      await persistStatus(nextValue, { silent: true });
      setStatusValue(nextValue);

      if (stepValue === EMPLOYER_INTERVIEW_STATUS) {
        setInterviewForm({ dateTime: "", location: "", items: "" });
        setPendingInterviewStep(null);
        setIsInterviewModalOpen(false);
      }
      if (stepValue === EMPLOYER_DECISION_STATUS) {
        setDecisionForm({ decision: "accepted", note: "" });
        setPendingDecisionStep(null);
        setIsDecisionModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Email yuborishda xato. Keyinroq qayta urinib ko'ring.");
    } finally {
      setSendingStepValue(null);
    }
  }

  function handleSendStatusEmail(stepValue) {
    if (isLimitedAdmin) {
      toast.error("Sizda email yuborish huquqi yo'q.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("Faqat joriy bosqich uchun email yuborish mumkin.");
      return;
    }
    if (stepValue === EMPLOYER_INTERVIEW_STATUS) {
      setPendingInterviewStep(stepValue);
      setIsInterviewModalOpen(true);
      return;
    }
    if (stepValue === EMPLOYER_DECISION_STATUS) {
      setPendingDecisionStep(stepValue);
      setIsDecisionModalOpen(true);
      return;
    }
    sendStatusEmail(stepValue);
  }

  function closeInterviewModal() {
    if (sendingStepValue === EMPLOYER_INTERVIEW_STATUS) return;
    setIsInterviewModalOpen(false);
    setPendingInterviewStep(null);
  }

  async function handleInterviewSubmit(e) {
    e?.preventDefault();
    if (!pendingInterviewStep) {
      setIsInterviewModalOpen(false);
      return;
    }
    const dateTime = String(interviewForm.dateTime || "").trim();
    const location = String(interviewForm.location || "").trim();
    const items = String(interviewForm.items || "").trim();

    if (!dateTime) {
      toast.error("Suhbat sanasi va vaqtini kiriting.");
      return;
    }
    if (!location) {
      toast.error("Suhbat manzilini kiriting.");
      return;
    }
    if (!items) {
      toast.error("Nima olib kelish kerakligini kiriting.");
      return;
    }

    await sendStatusEmail(pendingInterviewStep, {
      interviewDetails: { dateTime, location, items },
    });
  }

  function closeDecisionModal() {
    if (sendingStepValue === EMPLOYER_DECISION_STATUS) return;
    setIsDecisionModalOpen(false);
    setPendingDecisionStep(null);
  }

  async function handleDecisionSubmit(e) {
    e?.preventDefault();
    if (!pendingDecisionStep) {
      setIsDecisionModalOpen(false);
      return;
    }
    const selectedDecision =
      decisionForm.decision === "rejected" ? "rejected" : "accepted";

    await sendStatusEmail(pendingDecisionStep, {
      employerDecision: selectedDecision,
      decisionNote: String(decisionForm.note || "").trim(),
    });
  }

  async function handleSave() {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    const commentHasContent = hasRichTextContent(formCv.commentar);
    const originalComment = String(docCv?.commentar || "");
    const isCommentUpdated =
      String(formCv.commentar || "") !== String(originalComment || "");

    const nextCommentMeta = isCommentUpdated
      ? {
          updatedAt: Date.now(),
          updatedByUid: user?.uid || "",
          updatedByName:
            user?.displayName || user?.email || user?.phoneNumber || "Nomaʼlum",
          updatedByPhoto: user?.photoURL || "",
        }
      : null;

    if (!isLimitedAdmin) {
      if (!formCv.personalInfo.name?.trim()) {
        toast.error("Vorname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.lastName?.trim()) {
        toast.error("Nachname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.gender) {
        toast.error("Bitte Geschlecht auswählen.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = isLimitedAdmin
        ? { commentar: String(formCv.commentar || "") }
        : mapFormToDoc(formCv);
      if (nextCommentMeta) {
        payload.commentarMeta = nextCommentMeta;
      }
      await updateDocument(col, docId, payload);
      toast.success(
        isLimitedAdmin
          ? "Kommentar wurde gespeichert."
          : "Änderungen wurden gespeichert."
      );
      if (isLimitedAdmin) {
        setCommentBaseline(formCv.commentar || "");
      }
      if (nextCommentMeta) {
        setCommentMeta(nextCommentMeta);
      }
      if (commentHasContent) {
        setIsCommentEditorOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung zum Herunterladen.");
      return;
    }
    try {
      setIsDownloading(true);
      const firstName = String(formCv.personalInfo.name || "").trim();
      const lastName = String(formCv.personalInfo.lastName || "").trim();
      const candidateName = [firstName, lastName].filter(Boolean).join(" ");
      const fileBase = candidateName
        ? `Lebenslauf ${candidateName}`
        : "Lebenslauf";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Lebenslauf";
      const blob = await pdf(
        <CvPdfDocument form={formCv} showDocuments={showDocuments} />
      ).toBlob();
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
  const firstName = String(formCv.personalInfo.name || "").trim();
  const lastName = String(formCv.personalInfo.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(formCv.personalInfo.address || "").trim();
  const birthDate = String(formCv.personalInfo.birthDate || "").trim();
  const phone = String(formCv.personalInfo.phone || "").trim();
  const email = String(formCv.personalInfo.email || "").trim();
  const maritalStatus = String(formCv.personalInfo.maritalStatus || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  function openPhotoModal() {
    if (!photo) return;
    setPhotoModalSrc(photo);
    setIsPhotoModalOpen(true);
  }

  function closePhotoModal() {
    setIsPhotoModalOpen(false);
    setPhotoModalSrc("");
  }

  // Shared DaisyUI input styles for the edit form
  const inputBase = "input input-bordered w-full";
  const selectBase = "select select-bordered w-full";
  const textareaBase = "textarea textarea-bordered w-full";
  const fileInputBase =
    "file-input file-input-bordered file-input-primary w-full";

  // Style overrides for FormInput component

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

  const formCardLimited =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto";
  const formCardAdmin =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  const formSectionClass = isLimitedAdmin
    ? `${formCardLimited} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`
    : `${formCardAdmin} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`;

  const canSaveComment = commentChanged && !isSaving && !loading && !notFound;
  const showCommentPreview = !isCommentEditorOpen;
  const commentActionLabel = !isCommentEditorOpen ? "Qo'shish" : "Bekor qilish";
  const showLimitedCommentSaveButton =
    isLimitedAdmin &&
    isCommentEditorOpen &&
    commentChanged &&
    !loading &&
    !notFound;

  function formatCommentDate(val) {
    if (!val) return "";
    try {
      if (val?.seconds)
        return new Date(val.seconds * 1000).toLocaleString("de-DE");
      if (typeof val === "number") return new Date(val).toLocaleString("de-DE");
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime()))
        return parsed.toLocaleString("de-DE");
    } catch (err) {
      console.error("formatCommentDate error:", err);
    }
    return "";
  }

  const renderCommentPreview = (extraClassName = "") => (
    <div
      className={`rounded-lg border border-base-300 bg-base-100 p-3 max-h-60 overflow-auto ${extraClassName}`}
    >
      {hasComment ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {commentMeta?.updatedByPhoto ? (
                <img
                  src={commentMeta.updatedByPhoto}
                  alt={commentMeta?.updatedByName || "Kommentator"}
                  className="w-8 h-8 rounded-full object-cover border border-base-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-base-300 text-base-content/70 flex items-center justify-center text-xs font-semibold">
                  {(commentMeta?.updatedByName || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold text-base-content">
                  {commentMeta?.updatedByName || "Nomaʼlum foydalanuvchi"}
                </div>
                {commentMeta?.updatedAt && (
                  <div className="text-[11px] text-base-content/60">
                    Yangilandi: {formatCommentDate(commentMeta.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none text-base-content"
            dangerouslySetInnerHTML={{ __html: formCv.commentar }}
          />
        </div>
      ) : (
        <p className="text-sm text-base-content/60 italic">
          Kommentariya yo&apos;q.
        </p>
      )}
    </div>
  );

  function openCommentEditor() {
    setCommentBaseline(formCv.commentar || "");
    setIsCommentEditorOpen(true);
  }

  function handleCommentPrimaryAction() {
    if (!isCommentEditorOpen) {
      openCommentEditor();
      return;
    }
    setIsCommentEditorOpen(false);
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-base-200 min-h-screen">
      <div className="w-full">
        {/* Controls (hidden on print) */}
        <div className="flex items-center justify-between mb-6 pb-2 md:pb-3 print:hidden">
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
            {!isLimitedAdmin && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  <FaSave />
                  <span>Saqlash</span>
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleCancel}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  Bekor qilish
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadPdf}
                  disabled={loading || notFound || isDownloading}
                >
                  <FaDownload />{" "}
                  {isDownloading ? "Wird geladen..." : "Herunterladen"}
                </button>
              </>
            )}
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
          <>
            <div className={layoutClass}>
              <section className={formSectionClass}>
                <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="card-title text-2xl font-bold">
                      Daten bearbeiten
                    </h2>
                  </div>

                  {isLimitedAdmin && (
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Profil rasmi
                        </p>
                        {photo ? (
                          <button
                            type="button"
                            className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={openPhotoModal}
                          >
                            <img
                              src={photo}
                              alt="Kandidat foto"
                              className="w-[128pt] h-[160pt] object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
                            Foto mavjud emas
                          </div>
                        )}
                        {photo && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={openPhotoModal}
                          >
                            Katta ko‘rish
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <fieldset
                    disabled={isLimitedAdmin}
                    className="space-y-4 disabled:opacity-70"
                  >
                    <div className="divider mt-2">Persönliche Daten</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Vorname"
                        placeholder="Vorname"
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
                        label="Nachname"
                        placeholder="Nachname"
                        value={formCv.personalInfo.lastName}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              lastName: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="md:col-span-2">
                        <label className="label">
                          <span className="label-text">Geschlecht</span>
                        </label>
                        <div className="flex gap-6">
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Männlich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Männlich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Männlich</span>
                          </label>
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Weiblich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Weiblich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Weiblich</span>
                          </label>
                        </div>
                      </div>
                      <FormInput
                        label="Geburtsdatum"
                        type="date"
                        placeholder="YYYY-MM-DD"
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
                        <label
                          className="label pb-1 flex-col items-start gap-1"
                          htmlFor="g-photo-file"
                        >
                          <span className="label-text font-medium">
                            Foto hochladen (JPEG/PNG)
                          </span>
                          <span className="label-text-alt text-xs text-base-content/70">
                            Bis 250 KB
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
                          <span className="label-text font-medium">
                            Adresse
                          </span>
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
                      onRemoveSoft={(i) =>
                        removeTag(["skills", "softSkills"], i)
                      }
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
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                        Diplome
                      </h4>
                      <div className="flex flex-col gap-2">
                        {!formCv.documents?.diplomas ||
                        formCv.documents.diplomas.length === 0 ? (
                          <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                            Keine Diplome vorhanden.
                          </div>
                        ) : (
                          formCv.documents.diplomas.map((url, i) => (
                            <div
                              key={i}
                              className="flex gap-2 items-center p-2 bg-base-100 border rounded"
                            >
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
                    <div className="mb-2">
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                        Zertifikate
                      </h4>
                      <div className="flex flex-col gap-2">
                        {!formCv.documents?.certificates ||
                        formCv.documents.certificates.length === 0 ? (
                          <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                            Keine Zertifikate vorhanden.
                          </div>
                        ) : (
                          formCv.documents.certificates.map((url, i) => (
                            <div
                              key={i}
                              className="flex gap-2 items-center p-2 bg-base-100 border rounded"
                            >
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
                  </fieldset>

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider mt-1">Kommentar</div>
                      <div className="form-control gap-3">
                        <label className="label" htmlFor="comment-admin">
                          <span className="label-text font-medium">
                            Allgemeiner Kommentar (Kandidat haqida)
                          </span>
                        </label>
                        {showCommentPreview && renderCommentPreview()}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={formCv.commentar}
                            onChange={(val) =>
                              setFormCv((prev) => ({
                                ...prev,
                                commentar: val,
                              }))
                            }
                            placeholder='Umumiy fikr: "Kandidat juda mos, faqat foto yangilansin"'
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider"></div>
                      <div className="flex justify-end gap-2"></div>
                    </>
                  )}
                </div>
              </section>

              {isLimitedAdmin && (
                <>
                  {/* Right: Kommentar (sticky) */}
                  <aside className="w-full lg:basis-[40%] lg:max-w-[40%] shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[90vh] flex">
                    <div className="card bg-base-100 border border-base-300 shadow-2xl w-full h-full flex flex-col">
                      <div className="card-body space-y-3 flex-1 flex flex-col">
                        <div>
                          <h3 className="card-title text-lg mb-1">Kommentar</h3>
                          <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                            Kandidat haqida eslatma
                          </p>
                        </div>
                        {showCommentPreview && renderCommentPreview("flex-1")}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={formCv.commentar}
                            onChange={(val) =>
                              setFormCv((prev) => ({ ...prev, commentar: val }))
                            }
                            placeholder='Umumiy fikr: "Kandidat juda mos, faqat foto yangilansin"'
                            className="flex-1"
                            editorClassName="min-h-[220px]"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline w-full"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                        </div>
                        <div className="pt-2">
                          {showLimitedCommentSaveButton && (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className={`btn btn-primary w-full ${
                                  !canSaveComment ? "btn-disabled" : ""
                                }`}
                                onClick={handleSave}
                                disabled={!canSaveComment}
                              >
                                {isSaving ? (
                                  <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Saqlanmoqda...
                                  </>
                                ) : (
                                  <>
                                    <FaSave />
                                    <span>Saqlash</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn w-full"
                                onClick={handleCancel}
                                disabled={!hasUnsavedChanges || isSaving}
                              >
                                Bekor qilish
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                </>
              )}

              {/* Right: Live Preview (WYSIWYG) */}
              {!isLimitedAdmin && (
                <section className="hidden lg:block flex-1 min-w-0 h-[calc(100vh-2rem)] sticky top-4">
                  <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner h-full flex flex-col overflow-hidden">
                    <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider z-10">
                      <span>Vorschau (A4)</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live-Aktualisierung
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full flex justify-center items-start bg-slate-100">
                      <div
                        className="bg-white shadow-2xl w-full max-w-full min-h-[297mm] p-[44pt] text-[#0f172a] text-[11pt] leading-[1.38] origin-top shrink-0"
                        style={{
                          fontFamily: "Inter, Helvetica, Arial, sans-serif",
                        }}
                      >
                        <div className="flex flex-col gap-[18pt]">
                          {/* Header */}
                          <div className="mb-[18pt]">
                            <h1 className="text-[24pt] font-bold text-[#0f172a] leading-tight">
                              {fullName}
                            </h1>
                            <div className="h-[2pt] bg-[#1f2937] mt-[17pt] mb-[12pt] w-full" />

                            <div className="flex flex-row gap-[22pt]">
                              <div className="flex-1">
                                <div className="flex flex-col gap-[6pt] mt-1">
                                  <PreviewInfoRow
                                    label="Name"
                                    value={fullName}
                                  />
                                  <PreviewInfoRow
                                    label="Anschrift"
                                    value={address}
                                  />
                                  <PreviewInfoRow
                                    label="geb."
                                    value={birthDate}
                                  />
                                  <PreviewInfoRow
                                    label="Familienstand"
                                    value={maritalStatus}
                                  />
                                  <PreviewInfoRow label="Tel" value={phone} />
                                  <PreviewInfoRow
                                    label="E-Mail"
                                    value={email}
                                  />
                                </div>
                              </div>

                              <div className="shrink-0">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt="Foto"
                                    role="button"
                                    tabIndex={0}
                                    onClick={openPhotoModal}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openPhotoModal();
                                      }
                                    }}
                                    className="w-[128pt] h-[160pt] object-cover border border-[#d9dee3] rounded-[8pt] cursor-zoom-in transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                                  />
                                ) : (
                                  <div className="w-[128pt] h-[160pt] border border-[#d9dee3] rounded-[8pt] flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                                    Foto
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 pr-[6pt]">
                            {/* Berufliche Laufbahn */}
                            {formCv.experience.length > 0 && (
                              <>
                                <PreviewSectionTitle>
                                  Berufliche Laufbahn
                                </PreviewSectionTitle>
                                <div className="flex flex-col gap-[10pt]">
                                  {formCv.experience.map((exp, i) => (
                                    <div
                                      key={i}
                                      className="flex flex-row gap-[10pt]"
                                    >
                                      <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                                        {(exp.startDate || "—") +
                                          " – " +
                                          (exp.endDate || "heute")}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-bold text-[#0f172a]">
                                          {exp.position || "—"}
                                          {exp.location
                                            ? `, ${exp.location}`
                                            : ""}
                                        </div>
                                        {exp.company && (
                                          <div className="italic text-[#475569]">
                                            {exp.company}
                                          </div>
                                        )}
                                        {Array.isArray(exp.responsibilities) &&
                                          exp.responsibilities.length > 0 && (
                                            <div className="mt-[4pt]">
                                              {exp.responsibilities.map(
                                                (r, ri) => (
                                                  <div
                                                    key={ri}
                                                    className="flex flex-row gap-[6pt]"
                                                  >
                                                    <span>•</span>
                                                    <span>{r}</span>
                                                  </div>
                                                )
                                              )}
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
                                <PreviewSectionTitle>
                                  Ausbildung
                                </PreviewSectionTitle>
                                <div className="flex flex-col gap-[10pt]">
                                  {formCv.education.map((edu, i) => (
                                    <div
                                      key={i}
                                      className="flex flex-row gap-[10pt]"
                                    >
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
                              Object.entries(formCv.skills.languages || {})
                                .length > 0 ||
                              formCv.skills.pcSkills?.length > 0) && (
                              <>
                                <PreviewSectionTitle>
                                  Kenntnisse & Fähigkeiten
                                </PreviewSectionTitle>
                                <div className="flex flex-col gap-[12pt]">
                                  {formCv.skills.softSkills?.length > 0 && (
                                    <div className="flex flex-col gap-[4pt]">
                                      <div className="font-bold">
                                        Fähigkeiten
                                      </div>
                                      <div className="flex flex-col gap-[3pt]">
                                        {formCv.skills.softSkills.map(
                                          (s, i) => (
                                            <div
                                              key={i}
                                              className="flex flex-row gap-[6pt]"
                                            >
                                              <span>•</span>
                                              <span>{s}</span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {Object.entries(formCv.skills.languages || {})
                                    .length > 0 && (
                                    <div className="flex flex-col gap-[4pt]">
                                      <div className="font-bold">
                                        Fremdsprachen
                                      </div>
                                      <div className="flex flex-col gap-[3pt]">
                                        {Object.entries(
                                          formCv.skills.languages
                                        ).map(([lang, level]) => (
                                          <div
                                            key={lang}
                                            className="flex flex-row gap-[6pt]"
                                          >
                                            <span>•</span>
                                            <span>
                                              {lang} — {level}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {formCv.skills.pcSkills?.length > 0 && (
                                    <div className="flex flex-col gap-[4pt]">
                                      <div className="font-bold">
                                        PC-Kenntnisse
                                      </div>
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
                            {showDocuments &&
                              (formCv.documents?.diplomas?.length > 0 ||
                                formCv.documents?.certificates?.length > 0) && (
                                <>
                                  <PreviewSectionTitle>
                                    Dokumente
                                  </PreviewSectionTitle>
                                  <div className="flex flex-col gap-[12pt]">
                                    {formCv.documents.diplomas?.length > 0 && (
                                      <div className="flex flex-col gap-[4pt]">
                                        <div className="font-bold">Diplome</div>
                                        <div className="flex flex-col gap-[3pt]">
                                          {formCv.documents.diplomas.map(
                                            (url, i) => (
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
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {formCv.documents.certificates?.length >
                                      0 && (
                                      <div className="flex flex-col gap-[4pt]">
                                        <div className="font-bold">
                                          Zertifikate
                                        </div>
                                        <div className="flex flex-col gap-[3pt]">
                                          {formCv.documents.certificates.map(
                                            (url, i) => (
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
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stepper should be below the form & preview */}
      {!isLimitedAdmin && !loading && !notFound && (
        <div className="mt-6">
          <CandidateStatusStepper
            currentValue={statusValue}
            onSendEmail={handleSendStatusEmail}
            sendingValue={sendingStepValue}
            disabled={isLimitedAdmin}
          />
          <div className="text-xs opacity-60 mt-2">
            Oxirgi yangilanish:{" "}
            {statusUpdatedAt
              ? new Date(statusUpdatedAt).toLocaleString("de-DE")
              : "—"}
            {statusUpdatedBy ? ` • Kim: ${statusUpdatedBy}` : ""}
          </div>
        </div>
      )}

      {isPhotoModalOpen && photoModalSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
          <div
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={closePhotoModal}
          />
          <div className="relative w-full max-w-4xl mx-4">
            <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-4 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Foto ko&apos;rinishi</h3>
                  <p className="text-sm opacity-70">
                    Live Preview dagi rasmni kattalashtirilgan holda
                    ko&apos;rish.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closePhotoModal}
                  aria-label="Modalni yopish"
                >
                  ✕
                </button>
              </div>
              <div className="bg-base-200 rounded-lg border border-base-300 p-2 sm:p-3 max-h-[80vh] overflow-auto">
                <img
                  src={photoModalSrc}
                  alt="Foto"
                  className="w-full max-h-[72vh] object-contain rounded-md bg-base-100"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isInterviewModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
          <div
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={closeInterviewModal}
          />
          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Suhbat tafsilotlarini yuborish
                  </h3>
                  <p className="text-sm opacity-70">
                    Suhbat sanasi/vaqti, manzil va olib kelish kerak
                    bo&apos;lgan narsalarni kiriting.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeInterviewModal}
                  disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  aria-label="Modalni yopish"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleInterviewSubmit}>
                <div className="form-control">
                  <label className="label" htmlFor="interview-date-time">
                    <span className="label-text font-medium">
                      Suhbat sanasi va vaqti
                    </span>
                  </label>
                  <input
                    id="interview-date-time"
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={interviewForm.dateTime}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        dateTime: e.target.value,
                      }))
                    }
                    disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="interview-location">
                    <span className="label-text font-medium">Manzil</span>
                  </label>
                  <input
                    id="interview-location"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Masalan: Tashkent, Amir Temur 12, 3-qavat"
                    value={interviewForm.location}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="interview-items">
                    <span className="label-text font-medium">
                      Nimalarni olib kelish kerak
                    </span>
                  </label>
                  <textarea
                    id="interview-items"
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="Masalan: pasport, CV nusxasi, diplomlar"
                    value={interviewForm.items}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        items: e.target.value,
                      }))
                    }
                    disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeInterviewModal}
                    disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingStepValue === EMPLOYER_INTERVIEW_STATUS}
                  >
                    {sendingStepValue === EMPLOYER_INTERVIEW_STATUS ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Jo'natish"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isDecisionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
          <div
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={closeDecisionModal}
          />
          <div className="relative w-full max-w-3xl mx-4">
            <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Ish beruvchining qarorini yuborish
                  </h3>
                  <p className="text-sm opacity-70">
                    Nomzodga qaror (qabul yoki rad) haqida muloyim tarzda xabar
                    bering.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeDecisionModal}
                  disabled={sendingStepValue === EMPLOYER_DECISION_STATUS}
                  aria-label="Modalni yopish"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleDecisionSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`card border transition cursor-pointer ${
                      decisionForm.decision === "accepted"
                        ? "border-success bg-success/5"
                        : "border-base-300 hover:border-success/60"
                    }`}
                  >
                    <div className="card-body p-4 gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="employer-decision"
                          className="radio radio-success"
                          value="accepted"
                          checked={decisionForm.decision === "accepted"}
                          onChange={() =>
                            setDecisionForm((prev) => ({
                              ...prev,
                              decision: "accepted",
                            }))
                          }
                          disabled={
                            sendingStepValue === EMPLOYER_DECISION_STATUS
                          }
                        />
                        <div className="font-semibold">Qabul qilindi</div>
                      </div>
                      <p className="text-sm opacity-70">
                        Hujjatlarni tayyorlash uchun @consultinguz_chat bilan
                        bog&apos;laning.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`card border transition cursor-pointer ${
                      decisionForm.decision === "rejected"
                        ? "border-error bg-error/5"
                        : "border-base-300 hover:border-error/60"
                    }`}
                  >
                    <div className="card-body p-4 gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="employer-decision"
                          className="radio radio-error"
                          value="rejected"
                          checked={decisionForm.decision === "rejected"}
                          onChange={() =>
                            setDecisionForm((prev) => ({
                              ...prev,
                              decision: "rejected",
                            }))
                          }
                          disabled={
                            sendingStepValue === EMPLOYER_DECISION_STATUS
                          }
                        />
                        <div className="font-semibold">Rad etildi</div>
                      </div>
                      <p className="text-sm opacity-70">
                        Jarayon boshqa yo&apos;nalishda davom etadi. Mos
                        vakansiyalar bo&apos;lsa, xabardor qilamiz.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeDecisionModal}
                    disabled={sendingStepValue === EMPLOYER_DECISION_STATUS}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingStepValue === EMPLOYER_DECISION_STATUS}
                  >
                    {sendingStepValue === EMPLOYER_DECISION_STATUS ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Jo'natish"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
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
