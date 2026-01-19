import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  FaCommentDots,
  FaEnvelope,
  FaPhone,
  FaTrash,
  FaUsers,
  FaChartLine,
  FaComments,
  FaEnvelopeOpen,
  FaTelegram,
  FaThumbsUp,
  FaThumbsDown,
  FaFileExcel,
} from "react-icons/fa";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import {
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  getMetaByName,
  deleteEmailAndPassIdByEmail,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
  getUserByEmail,
} from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CollapsibleSection from "../components/CollapsibleSection";
import CandidateCard from "../components/CandidateCard";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../constants/candidateStatus";
import { hasRichTextContent } from "../utils/commentar";
import { exportCandidatesToExcel, exportFullCandidatesToExcel } from "../utils/excelExport";
import { getDocs } from "firebase/firestore";

function CollectionCv() {
  const { major } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [resolvingMajor, setResolvingMajor] = useState(true);
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [commentFilter, setCommentFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [stageOutcomeFilter, setStageOutcomeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [drivingFilter, setDrivingFilter] = useState("all");
  const [langLevelFilter, setLangLevelFilter] = useState("all");
  const { role } = useUserRole();
  const isLimitedAdmin = role === "limited_admin";
  const isSuperAdmin = role === "super_admin";
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [userPhotosCache, setUserPhotosCache] = useState({});
  const fetchedEmailsRef = useRef(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const [exporting, setExporting] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  function handleExportExcel() {
    if (exporting || filteredItems.length === 0) return;
    setExporting(true);
    try {
      exportCandidatesToExcel(filteredItems, title);
      toast.success(`${filteredItems.length} Kandidaten exportiert.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportFullExcel() {
    if (exportingFull || items.length === 0) return;
    const colName = String(resolvedMajor?.collectionName || "").trim();
    if (!colName) {
      toast.error("Berufsfeld nicht gefunden.");
      return;
    }
    setExportingFull(true);
    try {
      toast("To'liq ma'lumotlar yuklanmoqda...", { duration: 2000 });
      const q = query(collection(db, colName), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fullDocs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      exportFullCandidatesToExcel(fullDocs, title);
      toast.success(`${fullDocs.length} kandidat to'liq ma'lumotlari eksport qilindi.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExportingFull(false);
    }
  }

  function calculateAgeFromDDMMYYYY(value) {
    try {
      if (!value || typeof value !== "string") return null;
      const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (!m) return null;
      const [, dd, mm, yyyy] = m;
      const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (Number.isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 1 || age > 120) return null;
      return age;
    } catch {
      return null;
    }
  }

  const title = useMemo(() => {
    const n = String(resolvedMajor?.title || "").trim();
    return n ? n : "—";
  }, [resolvedMajor]);

  function toDateFromMetaCreatedAt(value) {
    if (!value) return null;
    // Stored as Date.now() (number), but handle Timestamp-like objects as well.
    if (typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
      const n = Number(value);
      if (!Number.isNaN(n)) {
        const d = new Date(n);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "object") {
      // Firestore Timestamp has toDate()
      if (typeof value.toDate === "function") {
        try {
          const d = value.toDate();
          return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
        } catch {
          return null;
        }
      }
      // { seconds, nanoseconds }
      if (typeof value.seconds === "number") {
        const d = new Date(value.seconds * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
    return null;
  }

  const majorCreatedAtLabel = useMemo(() => {
    const d = toDateFromMetaCreatedAt(metaInfo?.createdAt);
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tashkent",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }, [metaInfo]);

  const majorCreatedByLabel = useMemo(() => {
    const v = String(metaInfo?.createdBy || "").trim();
    return v || "System";
  }, [metaInfo]);

  function formatCreatedAt(value) {
    const d = toDateFromMetaCreatedAt(value);
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tashkent",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  const filteredItems = useMemo(() => {
    const ranges = {
      all: null,
      "18_25": { min: 18, max: 25 },
      "26_35": { min: 26, max: 35 },
      "36_45": { min: 36, max: 45 },
      "46_plus": { min: 46, max: null },
    };
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    return items.filter((it) => {
      if (certificateFilter === "with" && !it.hasCertificate) return false;
      if (certificateFilter === "without" && it.hasCertificate) return false;

      if (experienceFilter === "with" && !it.hasExperience) return false;
      if (experienceFilter === "without" && it.hasExperience) return false;

      if (commentFilter === "with" && !it.hasComment) return false;
      if (commentFilter === "without" && it.hasComment) return false;

      if (stageFilter !== "all") {
        if (
          String(it.statusValue || "").trim() !==
          String(stageFilter || "").trim()
        )
          return false;
      }

      if (stageOutcomeFilter !== "all") {
        const [stageKey, decisionRaw] = String(stageOutcomeFilter || "")
          .split(":")
          .map((s) => String(s || "").trim());
        const decision = decisionRaw === "rejected" ? "rejected" : "accepted";
        const stageDecisions =
          it?.stageDecisions && typeof it.stageDecisions === "object"
            ? it.stageDecisions
            : {};
        if (!stageKey || !stageDecisions[stageKey]) return false;
        if (stageDecisions[stageKey] !== decision) return false;
      }

      if (ageFilter !== "all") {
        const range = ranges[ageFilter];
        if (!range || typeof it.age !== "number") return false;
        if (range.min !== null && it.age < range.min) return false;
        if (range.max !== null && it.age > range.max) return false;
      }

      if (drivingFilter === "with" && !it.hasDrivingLicense) return false;
      if (drivingFilter === "without" && it.hasDrivingLicense) return false;

      if (langLevelFilter !== "all") {
        const wanted = String(langLevelFilter || "").toUpperCase();
        if (!Array.isArray(it.langLevels) || it.langLevels.length === 0)
          return false;
        if (!it.langLevels.some((lv) => lv === wanted)) return false;
      }

      if (tokens.length === 0) return true;
      const name = String(it.name || "").toLowerCase();
      return tokens.every((t) => name.includes(t));
    });
  }, [
    items,
    searchQuery,
    certificateFilter,
    experienceFilter,
    commentFilter,
    stageFilter,
    stageOutcomeFilter,
    ageFilter,
    drivingFilter,
    langLevelFilter,
  ]);

  const hasActiveFilters =
    certificateFilter !== "all" ||
    experienceFilter !== "all" ||
    commentFilter !== "all" ||
    stageFilter !== "all" ||
    stageOutcomeFilter !== "all" ||
    ageFilter !== "all" ||
    drivingFilter !== "all" ||
    langLevelFilter !== "all" ||
    Boolean(searchQuery.trim());

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    certificateFilter,
    experienceFilter,
    commentFilter,
    stageFilter,
    stageOutcomeFilter,
    ageFilter,
    drivingFilter,
    langLevelFilter,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (certificateFilter !== "all") count++;
    if (experienceFilter !== "all") count++;
    if (commentFilter !== "all") count++;
    if (stageFilter !== "all") count++;
    if (stageOutcomeFilter !== "all") count++;
    if (ageFilter !== "all") count++;
    if (drivingFilter !== "all") count++;
    if (langLevelFilter !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    ageFilter,
    certificateFilter,
    commentFilter,
    drivingFilter,
    experienceFilter,
    langLevelFilter,
    stageFilter,
    stageOutcomeFilter,
    searchQuery,
  ]);

  const certificateTabs = [
    { value: "all", label: "Alle" },
    { value: "with", label: "Zertifikat vorhanden" },
    { value: "without", label: "Kein Zertifikat" },
  ];

  const experienceTabs = [
    { value: "all", label: "Alle" },
    { value: "with", label: "Erfahrung vorhanden" },
    { value: "without", label: "Keine Erfahrung" },
  ];

  const commentTabs = [
    { value: "all", label: "Alle" },
    { value: "with", label: "Kommentar vorhanden" },
    { value: "without", label: "Kein Kommentar" },
  ];

  const stageTabs = [
    { value: "all", label: "Alle" },
    ...CANDIDATE_STATUS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  ];

  const stageOutcomeTabs = [
    { value: "all", label: "Alle" },
    { value: "stage_1:accepted", label: "Stufe 1: angenommen" },
    { value: "stage_1:rejected", label: "Stufe 1: abgelehnt" },
    { value: "stage_2:accepted", label: "Stufe 2: angenommen" },
    { value: "stage_2:rejected", label: "Stufe 2: abgelehnt" },
    { value: "stage_2_result:accepted", label: "Stufe 2 Ergebnis: angenommen" },
    { value: "stage_2_result:rejected", label: "Stufe 2 Ergebnis: abgelehnt" },
    { value: "stage_3:accepted", label: "Stufe 3: angenommen" },
    { value: "stage_3:rejected", label: "Stufe 3: abgelehnt" },
    { value: "stage_4:accepted", label: "Arbeitgeber: angenommen" },
    { value: "stage_4:rejected", label: "Arbeitgeber: abgelehnt" },
  ];

  const ageTabs = [
    { value: "all", label: "Alle Altersgruppen" },
    { value: "18_25", label: "18-25" },
    { value: "26_35", label: "26-35" },
    { value: "36_45", label: "36-45" },
    { value: "46_plus", label: "46+" },
  ];

  const ageFilterLabel =
    ageTabs.find((t) => t.value === ageFilter)?.label || "Alle";

  const drivingTabs = [
    { value: "all", label: "Alle" },
    { value: "with", label: "Führerschein vorhanden" },
    { value: "without", label: "Kein Führerschein" },
  ];

  const langLevelTabs = [
    { value: "all", label: "Alle" },
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "C1", label: "C1" },
    { value: "C2", label: "C2" },
  ];

  const statistics = useMemo(() => {
    if (!items.length) return null;

    const total = items.length;
    const withEmail = items.filter(
      (item) => (item.emailSentCount || 0) > 0
    ).length;
    const withoutEmail = total - withEmail;
    const withComment = items.filter((item) => item.hasComment).length;
    const withoutComment = total - withComment;

    return {
      total,
      withEmail,
      withoutEmail,
      withComment,
      withoutComment,
    };
  }, [items]);

  const leadStats = useMemo(() => {
    const byLead = {};
    let telegramCount = 0;
    items.forEach((item) => {
      const lead = String(item?.lead || "").trim();
      if (lead) {
        byLead[lead] = (byLead[lead] || 0) + 1;
      }
      if (item?.telegramId) {
        telegramCount++;
      }
    });
    const leadList = Object.entries(byLead)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { leadList, telegramCount, total: items.length };
  }, [items]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (searchQuery.trim()) {
      badges.push({
        key: "search",
        label: `Suche: ${searchQuery.trim()}`,
        onClear: () => setSearchQuery(""),
      });
    }

    if (certificateFilter !== "all") {
      const label =
        certificateTabs.find((t) => t.value === certificateFilter)?.label ||
        certificateFilter;
      badges.push({
        key: "certificate",
        label: `Zertifikat: ${label}`,
        onClear: () => setCertificateFilter("all"),
      });
    }

    if (experienceFilter !== "all") {
      const label =
        experienceTabs.find((t) => t.value === experienceFilter)?.label ||
        experienceFilter;
      badges.push({
        key: "experience",
        label: `Erfahrung: ${label}`,
        onClear: () => setExperienceFilter("all"),
      });
    }

    if (commentFilter !== "all") {
      const label =
        commentTabs.find((t) => t.value === commentFilter)?.label ||
        commentFilter;
      badges.push({
        key: "comment",
        label: `Kommentar: ${label}`,
        onClear: () => setCommentFilter("all"),
      });
    }

    if (stageFilter !== "all") {
      const label =
        stageTabs.find((t) => t.value === stageFilter)?.label || stageFilter;
      badges.push({
        key: "stage",
        label: `Stufe: ${label}`,
        onClear: () => setStageFilter("all"),
      });
    }

    if (stageOutcomeFilter !== "all") {
      const label =
        stageOutcomeTabs.find((t) => t.value === stageOutcomeFilter)?.label ||
        stageOutcomeFilter;
      badges.push({
        key: "stageOutcome",
        label: `Ergebnis: ${label}`,
        onClear: () => setStageOutcomeFilter("all"),
      });
    }

    if (ageFilter !== "all") {
      const label =
        ageTabs.find((t) => t.value === ageFilter)?.label || ageFilter;
      badges.push({
        key: "age",
        label: `Alter: ${label}`,
        onClear: () => setAgeFilter("all"),
      });
    }

    if (drivingFilter !== "all") {
      const label =
        drivingTabs.find((t) => t.value === drivingFilter)?.label ||
        drivingFilter;
      badges.push({
        key: "driving",
        label: `Führerschein: ${label}`,
        onClear: () => setDrivingFilter("all"),
      });
    }

    if (langLevelFilter !== "all") {
      const label =
        langLevelTabs.find((t) => t.value === langLevelFilter)?.label ||
        langLevelFilter;
      badges.push({
        key: "langLevel",
        label: `Sprache: ${label}`,
        onClear: () => setLangLevelFilter("all"),
      });
    }

    return badges;
  }, [
    ageFilter,
    certificateFilter,
    certificateTabs,
    commentFilter,
    commentTabs,
    drivingFilter,
    drivingTabs,
    experienceFilter,
    experienceTabs,
    langLevelFilter,
    langLevelTabs,
    searchQuery,
    stageFilter,
    stageOutcomeFilter,
    stageOutcomeTabs,
    stageTabs,
  ]);

  const tabClass = (active) =>
    active
      ? "tab tab-active tab-sm whitespace-nowrap"
      : "tab tab-sm whitespace-nowrap";

  const chipClass = (active) =>
    active
      ? "btn btn-sm btn-primary gap-2"
      : "btn btn-sm btn-ghost gap-2 hover:bg-base-200";

  useEffect(() => {
    const key = String(major || "").trim();
    let cancelled = false;
    setResolvingMajor(true);
    setMetaLoading(true);
    (async () => {
      try {
        if (!key) {
          setResolvedMajor({ collectionName: "", title: "", linkId: "" });
          setMetaInfo(null);
          setLoading(false);
          return;
        }
        const meta = await getMetaByName(key);
        if (cancelled) return;
        if (meta) {
          setResolvedMajor({
            collectionName:
              meta.collectionName || meta.slug || meta.name || key,
            title: meta.title || meta.collectionName || key,
            linkId: meta.linkId || meta.uuid || meta.id || key,
          });
          setMetaInfo(meta);
        } else {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
      } catch (e) {
        if (!cancelled) {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
        if (!cancelled) setResolvingMajor(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [major]);

  useEffect(() => {
    const name = String(resolvedMajor?.collectionName || "").trim();
    // Wait until meta resolution finishes before deciding missing-major
    if (!name) {
      if (!metaLoading && !resolvingMajor) {
        toast.error("Name des Berufsfelds nicht gefunden.");
        setLoading(false);
      }
      return undefined;
    }

    // Optimized query: fetch all data for search functionality
    // Note: We need all documents for client-side search to work across all candidates
    const q = query(collection(db, name), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log(`📊 Loaded ${snap.docs.length} candidates from Firestore`);
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          const documents = data.documents || {};
          const langCerts = Array.isArray(documents?.certificates)
            ? documents.certificates
            : [];
          const hasCertificate = langCerts.length > 0;
          const hasExperience =
            Array.isArray(data.berufserfahrung) &&
            data.berufserfahrung.length > 0;
          const langLevels = Object.values(data.faehigkeiten?.sprachen || {})
            .map((lv) =>
              String(lv || "")
                .trim()
                .toUpperCase()
            )
            .filter((lv) => ["A1", "A2", "B1", "B2", "C1", "C2"].includes(lv));
          const pd = data.persoenlicheDaten || {};
          const firstName = String(pd.name || "").trim();
          const lastName = String(pd.nachname || "").trim();
          const fullName = [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          const age = calculateAgeFromDDMMYYYY(pd.geburtsdatum);
          const hasDrivingLicense = Boolean(pd.fuehrerschein);
          const rawStatusValue =
            typeof data?.status === "string"
              ? data.status
              : data?.status?.value || "";
          const statusValue =
            normalizeCandidateStatusValue(rawStatusValue) ||
            CANDIDATE_STATUS_DEFAULT;
          const statusMeta = getCandidateStatus(statusValue);
          const emailMeta = data?.emailMeta || {};
          const emailSentCountRaw =
            emailMeta?.count !== undefined && emailMeta?.count !== null
              ? emailMeta.count
              : 0;
          const emailSentCount =
            typeof emailSentCountRaw === "number"
              ? emailSentCountRaw
              : Number(emailSentCountRaw) || 0;
          const emailLastSentAt = emailMeta?.lastSentAt || null;
          const emailLastSentByName = emailMeta?.lastSentByName || "";
          const emailLastSentByPhoto = emailMeta?.lastSentByPhoto || "";
          const hasComment = hasRichTextContent(data?.commentar);
          const commentMeta = data?.commentarMeta || {};
          const commentUpdatedByName = commentMeta?.updatedByName || "";
          const commentUpdatedByPhoto = commentMeta?.updatedByPhoto || "";
          const stageMeta =
            data?.stageMeta && typeof data.stageMeta === "object"
              ? data.stageMeta
              : {};
          const stageDecisions = {};
          for (const k of [
            "stage_1",
            "stage_2",
            "stage_2_result",
            "stage_3",
            "stage_4",
          ]) {
            const raw = stageMeta?.[k]?.decision;
            if (raw === "accepted" || raw === "rejected") {
              stageDecisions[k] = raw;
            }
          }
          const reaction = data?.reaction || null;
          const statusUpdatedBy = data?.status?.updatedBy || "";
          const emailLastSentBy = emailMeta?.lastSentBy || "";
          const commentUpdatedBy = commentMeta?.updatedByName || "";

          return {
            id: d.id,
            createdAt: data.createdAt || 0,
            name: fullName,
            age,
            photo: pd.foto || "",
            phone: pd.telefon || "",
            email: pd.email || "",
            maritalStatus: pd.familienstand || "",
            hasCertificate,
            hasExperience,
            hasDrivingLicense,
            langLevels,
            statusValue,
            statusLabel: statusMeta.label,
            statusTone: statusMeta.badgeTone || "info",
            statusUpdatedAt: data?.status?.updatedAt || null,
            statusUpdatedBy,
            emailSentCount,
            emailLastSentAt,
            emailLastSentBy,
            emailLastSentByName,
            emailLastSentByPhoto,
            hasComment,
            commentUpdatedAt: commentMeta?.updatedAt || null,
            commentUpdatedBy,
            commentUpdatedByName,
            commentUpdatedByPhoto,
            stageDecisions,
            telegramId: data.telegramId || null,
            lead: data.lead || null,
            reaction,
            documentReady: data.documentReady || false,
          };
        });
        setItems(list);
        setLoading(false);
      },
      (err) => {
        toast.error("Fehler beim Laden der Daten.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, metaLoading, resolvingMajor]);

  // Fetch user photos from users collection based on status.updatedBy and commentMeta
  useEffect(() => {
    if (!items || items.length === 0) return;

    const fetchUserPhotos = async () => {
      const emailsToFetch = new Set();

      // Collect all unique emails/names that need photo lookup
      items.forEach((item) => {
        // From status.updatedBy (email)
        const statusUpdatedBy = item.statusUpdatedBy || "";
        if (
          statusUpdatedBy &&
          statusUpdatedBy.includes("@") &&
          !fetchedEmailsRef.current.has(statusUpdatedBy)
        ) {
          emailsToFetch.add(statusUpdatedBy);
        }

        // From emailMeta (already has photo, but we can refresh from users collection)
        const emailLastSentBy = item.emailLastSentBy || "";
        if (
          emailLastSentBy &&
          emailLastSentBy.includes("@") &&
          !item.emailLastSentByPhoto &&
          !fetchedEmailsRef.current.has(emailLastSentBy)
        ) {
          emailsToFetch.add(emailLastSentBy);
        }

        // From commentMeta (check if we need to fetch by name/email)
        // Note: commentUpdatedByName might be email or display name
        const commentUpdatedBy = item.commentUpdatedBy || "";
        if (
          commentUpdatedBy &&
          commentUpdatedBy.includes("@") &&
          !item.commentUpdatedByPhoto &&
          !fetchedEmailsRef.current.has(commentUpdatedBy)
        ) {
          emailsToFetch.add(commentUpdatedBy);
        }
      });

      if (emailsToFetch.size === 0) return;

      // Fetch user data from users collection
      const newPhotos = {};
      for (const email of emailsToFetch) {
        // Mark as fetched
        fetchedEmailsRef.current.add(email);

        try {
          const userData = await getUserByEmail(email);
          if (userData && userData.photoURL) {
            newPhotos[email] = userData.photoURL;
          }
        } catch (error) {
          console.error(`Failed to fetch user photo for ${email}:`, error);
        }
      }

      // Update cache if we have new photos
      if (Object.keys(newPhotos).length > 0) {
        setUserPhotosCache((prev) => ({ ...prev, ...newPhotos }));
      }
    };

    fetchUserPhotos();
  }, [items]);

  function openDeleteModal(item) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    if (!item?.id) return;
    setDeleteTarget({
      id: item.id,
      name: item.name || "",
      email: item.email || "",
    });
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deletingId) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = deleteTarget?.id;
    if (!colName || !itemId) return;
    try {
      setDeletingId(itemId);

      // 0) Load full candidate doc so we can snapshot it into deleted_users
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1) Remove from Firestore email registry (`email_and_passId`)
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "")
        .trim()
        .toLowerCase();
      if (targetEmail) {
        await deleteEmailAndPassIdByEmail(targetEmail);
      }

      // 1.5) Store deleted user snapshot in Firestore `deleted_users`
      await saveDeletedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        deletedBy: "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });
      toast.success("Kandidat erfolgreich gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  }

  async function confirmArchive() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = deleteTarget?.id;
    if (!colName || !itemId) return;
    try {
      setDeletingId(itemId);

      // 0) Load full candidate doc (we do NOT delete uploaded file URLs here)
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1.5) Store archived user snapshot in Firestore `archived_users`
      await saveArchivedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        archivedBy: "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });
      toast.success("Kandidat archiviert.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Fehler beim Archivieren.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReaction(itemId, reactionType) {
    if (!isSuperAdmin) {
      toast.error("Faqat super_admin reaktsiya qo'ya oladi.");
      return;
    }

    const colName = String(resolvedMajor?.collectionName || "").trim();
    if (!colName || !itemId) return;

    try {
      const candidateRef = doc(db, colName, itemId);
      const currentItem = items.find((item) => item.id === itemId);
      const currentReaction = currentItem?.reaction;

      const newReaction =
        currentReaction === reactionType ? null : reactionType;

      await updateDoc(candidateRef, {
        reaction: newReaction,
        reactionUpdatedAt: Date.now(),
      });

      toast.success(
        newReaction === "like"
          ? "👍 Gefällt mir"
          : newReaction === "dislike"
          ? "👎 Gefällt mir nicht"
          : "Reaktion entfernt"
      );
    } catch (err) {
      toast.error("Fehler beim Speichern der Reaktion.");
    }
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="mx-auto">
        <DeleteCandidateModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          onDelete={confirmDelete}
          onArchive={confirmArchive}
          onConfirm={confirmDelete}
          candidateName={deleteTarget?.name}
          isDeleting={Boolean(deletingId)}
          skipCountdown={true}
        />
        <div className="mb-4 sm:mb-6 flex items-center justify-between flex-col md:flex-row lg:flex-row">
          <div className="w-full md:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight">
              Berufsfeld: <span className="font-bold">{title}</span>
            </h1>
            <p className="text-sm opacity-70">
              Gefunden: {loading ? "..." : filteredItems.length} Kandidaten
            </p>
            <p className="text-sm opacity-70">
              Erstellt am: {metaLoading ? "..." : majorCreatedAtLabel}
            </p>
            <p className="text-sm opacity-70">
              Erstellt von: {metaLoading ? "..." : majorCreatedByLabel}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2 w-full md:w-auto">
            <div className="flex gap-2 flex-wrap">
              <input
                type="search"
                id="search"
                name="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full lg:w-64"
                placeholder="Nach Name suchen..."
                aria-label="Nach Name suchen"
              />
              <button
                type="button"
                className="btn btn-success btn-sm gap-2"
                onClick={handleExportExcel}
                disabled={exporting || loading || filteredItems.length === 0}
                title="Qisqa Excel eksport"
              >
                {exporting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FaFileExcel className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-success btn-sm gap-2"
                onClick={handleExportFullExcel}
                disabled={exportingFull || loading || items.length === 0}
                title="To'liq ma'lumotlar bilan Excel eksport"
              >
                {exportingFull ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FaFileExcel className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">To'liq Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        {statistics && (
          <div className="mb-6">
            <div className="bg-base-100 rounded-xl border border-base-300/60 shadow-sm p-3">
              <h3 className="text-xs font-semibold uppercase text-base-content/60 mb-2 flex items-center gap-2">
                <FaChartLine className="text-primary/60" />
                Statistik für {title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary tabular-nums">
                    <FaUsers className="text-sm" />
                    {statistics.total}
                  </div>
                  <div className="text-xs text-base-content/60">Gesamt</div>
                </div>
                <div className="text-center p-2 bg-success/5 rounded-lg border border-success/20">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-success tabular-nums">
                    <FaEnvelope className="text-sm" />
                    {statistics.withEmail}
                  </div>
                  <div className="text-xs text-base-content/60">E-Mail</div>
                </div>
                <div className="text-center p-2 bg-warning/5 rounded-lg border border-warning/20">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-warning tabular-nums">
                    <FaEnvelopeOpen className="text-sm" />
                    {statistics.withoutEmail}
                  </div>
                  <div className="text-xs text-base-content/60">
                    Keine E-Mail
                  </div>
                </div>
                <div className="text-center p-2 bg-info/5 rounded-lg border border-info/20">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-info tabular-nums">
                    <FaComments className="text-sm" />
                    {statistics.withComment}
                  </div>
                  <div className="text-xs text-base-content/60">Kommentar</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-base-300/30">
                <div className="flex justify-between items-center text-xs text-base-content/60">
                  <span className="flex items-center gap-1">
                    <FaCommentDots className="text-xs opacity-60" />
                    Ohne:{" "}
                    <span className="font-semibold text-base-content/80">
                      {statistics.withoutComment}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FaChartLine className="text-xs opacity-60" />
                    Rate:{" "}
                    <span className="font-semibold text-base-content/80">
                      {statistics.total > 0
                        ? Math.round(
                            (statistics.withEmail / statistics.total) * 100
                          )
                        : 0}
                      %
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lead & Telegram Statistics */}
        {!loading && items.length > 0 && (leadStats.telegramCount > 0 || leadStats.leadList.length > 0) && (
          <div className="mb-6 p-4 rounded-box border border-base-300 bg-base-100 shadow-sm">
            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="font-semibold text-primary">{leadStats.total}</span>
                <span className="text-sm text-base-content/70">Gesamt</span>
              </div>
              {leadStats.telegramCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
                  <FaTelegram className="w-5 h-5 text-[#0088cc]" />
                  <span className="font-semibold text-[#0088cc]">{leadStats.telegramCount}</span>
                  <span className="text-sm text-base-content/70">Telegram</span>
                </div>
              )}
              {leadStats.leadList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {leadStats.leadList.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
                    >
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{item.count}</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          {activeFilterBadges.length > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-base-content/60 shrink-0">
                Filter:
              </span>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {activeFilterBadges.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    className="badge badge-outline gap-1 py-2 px-2 sm:py-3 sm:px-3 cursor-pointer hover:bg-base-200 text-xs sm:text-sm"
                    title="Filter entfernen"
                    onClick={b.onClear}
                  >
                    <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-60 lg:max-w-80">
                      {b.label}
                    </span>
                    <span aria-hidden="true" className="text-xs sm:text-base">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <CollapsibleSection
            title="Filter"
            defaultOpen={false}
            className="shadow-md border-base-300/60"
            meta={`${activeFilterCount} aktiv`}
          >
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Schnellauswahl nach Zertifikat, Erfahrung und Alter.
                  </p>
                  <p className="text-xs text-base-content/60">
                    Auch nach Führerschein und Sprachniveau filtern.
                  </p>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline mt-2 sm:mt-0"
                    onClick={() => {
                      setCertificateFilter("all");
                      setExperienceFilter("all");
                      setCommentFilter("all");
                      setStageFilter("all");
                      setStageOutcomeFilter("all");
                      setAgeFilter("all");
                      setDrivingFilter("all");
                      setLangLevelFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    Filter zurücksetzen
                  </button>
                ) : (
                  <button
                    type="button"
                    className="badge badge-ghost mt-2 sm:mt-0 cursor-pointer hover:bg-base-200 transition-colors"
                    onClick={() => {
                      setCertificateFilter("all");
                      setExperienceFilter("all");
                      setCommentFilter("all");
                      setStageFilter("all");
                      setStageOutcomeFilter("all");
                      setAgeFilter("all");
                      setDrivingFilter("all");
                      setLangLevelFilter("all");
                      setSearchQuery("");
                    }}
                    title="Alle Filter aktivieren"
                  >
                    Keine Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Zertifikat:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {certificateTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            certificateFilter === tab.value
                          )}`}
                          onClick={() => setCertificateFilter(tab.value)}
                          type="button"
                        >
                          {certificateFilter === tab.value ? "●" : "○"}{" "}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Erfahrung:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {experienceTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            experienceFilter === tab.value
                          )}`}
                          onClick={() => setExperienceFilter(tab.value)}
                          type="button"
                        >
                          {experienceFilter === tab.value ? "●" : "○"}{" "}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Kommentar:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {commentTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            commentFilter === tab.value
                          )}`}
                          onClick={() => setCommentFilter(tab.value)}
                          type="button"
                        >
                          {commentFilter === tab.value ? "●" : "○"} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Stufe:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {stageTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            stageFilter === tab.value
                          )}`}
                          onClick={() => setStageFilter(tab.value)}
                          type="button"
                        >
                          {stageFilter === tab.value ? "●" : "○"} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Ergebnis:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {stageOutcomeTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            stageOutcomeFilter === tab.value
                          )}`}
                          onClick={() => setStageOutcomeFilter(tab.value)}
                          type="button"
                        >
                          {stageOutcomeFilter === tab.value ? "●" : "○"}{" "}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Alter:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {ageTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            ageFilter === tab.value
                          )}`}
                          onClick={() => setAgeFilter(tab.value)}
                          type="button"
                        >
                          {ageFilter === tab.value ? "●" : "○"} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Führerschein:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {drivingTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            drivingFilter === tab.value
                          )}`}
                          onClick={() => setDrivingFilter(tab.value)}
                          type="button"
                        >
                          {drivingFilter === tab.value ? "●" : "○"} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-base-content/60 block">
                      Sprachniveau:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {langLevelTabs.map((tab) => (
                        <button
                          key={tab.value}
                          className={`text-xs sm:text-sm ${chipClass(
                            langLevelFilter === tab.value
                          )}`}
                          onClick={() => setLangLevelFilter(tab.value)}
                          type="button"
                        >
                          {langLevelFilter === tab.value ? "●" : "○"}{" "}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="card bg-base-100 border border-base-300/60 shadow-sm animate-pulse"
              >
                <div className="card-body p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-full bg-base-300/50"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-base-300/50 rounded w-3/4"></div>
                      <div className="h-3 bg-base-300/50 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-base-300/50 rounded w-full"></div>
                    <div className="h-3 bg-base-300/50 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-base-300/50 rounded w-20"></div>
                    <div className="h-8 bg-base-300/50 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center py-24">
            <div className="text-center opacity-70">
              <p className="text-lg">Derzeit keine Daten vorhanden.</p>
              <p className="text-sm">
                Die Liste der Kandidaten erscheint hier.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="grid place-items-center py-24">
            <div className="text-center opacity-70">
              <p className="text-lg">Keine Ergebnisse gefunden.</p>
              <p className="text-sm mb-6">
                Versuchen Sie es mit einem anderen Namen.
              </p>
              <button
                className="btn btn-sm btn-outline btn-primary"
                onClick={() => setSearchQuery("")}
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {paginatedItems.map((item) =>
                (() => {
                  return (
                    <CandidateCard
                      key={item.id}
                      tone={item.statusTone || "info"}
                      onClick={() =>
                        navigate(
                          `/generate/${resolvedMajor.linkId || major}/${
                            item.id
                          }`
                        )
                      }
                      busy={deletingId === item.id}
                      name={item.name || "Ohne Namen"}
                      photo={item.photo || ""}
                      meta={
                        <>
                          {typeof item.age === "number" && item.age >= 1 ? (
                            <span className="text-base-content/70">
                              {item.age} Jahre
                            </span>
                          ) : null}
                          <span>{formatCreatedAt(item.createdAt)}</span>
                          {item.telegramId ? (
                            <span
                              className="inline-flex items-center gap-1 text-[#0088cc]"
                              title="Über Telegram registriert"
                            >
                              <FaTelegram className="w-3 h-3" />
                            </span>
                          ) : null}
                          {item.lead ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium"
                              title={`Lead: ${item.lead}`}
                            >
                              {item.lead}
                            </span>
                          ) : null}
                          {item.documentReady ? (
                            <span
                              className="inline-flex items-center gap-1 text-green-600"
                              title="Document is ready"
                            >
                              <HiMiniDocumentCheck className="w-4 h-4" />
                            </span>
                          ) : null}
                        </>
                      }
                      topRight={
                        !isLimitedAdmin ? (
                          <button
                            className="btn btn-ghost btn-circle btn-sm text-error/70 hover:text-error hover:bg-error/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(item);
                            }}
                            disabled={deletingId === item.id}
                            title="Löschen"
                            type="button"
                          >
                            {deletingId === item.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <FaTrash size={16} />
                            )}
                          </button>
                        ) : null
                      }
                      lines={[
                        item.phone
                          ? {
                              icon: <FaPhone className="w-4 h-4" />,
                              text: item.phone,
                              title: item.phone,
                            }
                          : null,
                        item.email
                          ? {
                              icon: <FaEnvelope className="w-4 h-4" />,
                              text: item.email,
                              title: item.email,
                            }
                          : null,
                      ].filter(Boolean)}
                      emptyLabel="Keine Kontaktdaten"
                      footer={
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60"
                              title={
                                item.emailSentCount > 0
                                  ? `E-Mails gesendet: ${
                                      item.emailSentCount || 0
                                    }${
                                      item.emailLastSentAt
                                        ? ` • Zuletzt: ${formatCreatedAt(
                                            item.emailLastSentAt
                                          )}`
                                        : ""
                                    }${
                                      item.emailLastSentByName
                                        ? ` • Von: ${item.emailLastSentByName}`
                                        : ""
                                    }`
                                  : "E-Mails gesendet: 0"
                              }
                            >
                              {(() => {
                                // Priority: 1) userPhotosCache, 2) emailLastSentByPhoto, 3) initials
                                const photoFromCache =
                                  userPhotosCache[item.emailLastSentBy] || null;
                                const photoUrl =
                                  photoFromCache ||
                                  item.emailLastSentByPhoto ||
                                  "";

                                if (photoUrl) {
                                  return (
                                    <>
                                      <div className="avatar">
                                        <div className="w-6 h-6 rounded-full">
                                          <img
                                            src={photoUrl}
                                            alt={
                                              item.emailLastSentByName || "User"
                                            }
                                            className="object-cover"
                                          />
                                        </div>
                                      </div>
                                      <FaEnvelope className="shrink-0 w-4 h-4 text-base-content/50" />
                                    </>
                                  );
                                }

                                if (item.emailLastSentByName) {
                                  return (
                                    <>
                                      <div className="avatar placeholder">
                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-content text-xs">
                                          <span>
                                            {item.emailLastSentByName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                      </div>
                                      <FaEnvelope className="shrink-0 w-4 h-4 text-base-content/50" />
                                    </>
                                  );
                                }

                                return (
                                  <FaEnvelope className="shrink-0 w-4 h-4 text-base-content/50" />
                                );
                              })()}
                              <span className="tabular-nums text-sm font-semibold">
                                {item.emailSentCount || 0}
                              </span>
                            </div>

                            {item.hasComment ? (
                              <div
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60"
                                title={
                                  item.commentUpdatedAt
                                    ? `Kommentar aktualisiert: ${formatCreatedAt(
                                        item.commentUpdatedAt
                                      )}${
                                        item.commentUpdatedByName
                                          ? ` • Von: ${item.commentUpdatedByName}`
                                          : ""
                                      }`
                                    : "Kommentar vorhanden"
                                }
                              >
                                {(() => {
                                  // Priority: 1) userPhotosCache, 2) commentUpdatedByPhoto, 3) initials
                                  const photoFromCache =
                                    userPhotosCache[item.commentUpdatedBy] ||
                                    null;
                                  const photoUrl =
                                    photoFromCache ||
                                    item.commentUpdatedByPhoto ||
                                    "";

                                  if (photoUrl) {
                                    return (
                                      <>
                                        <div className="avatar">
                                          <div className="w-6 h-6 rounded-full">
                                            <img
                                              src={photoUrl}
                                              alt={
                                                item.commentUpdatedByName ||
                                                "User"
                                              }
                                              className="object-cover"
                                            />
                                          </div>
                                        </div>
                                        <FaCommentDots className="shrink-0 w-5 h-5 text-success" />
                                      </>
                                    );
                                  }

                                  if (item.commentUpdatedByName) {
                                    return (
                                      <>
                                        <div className="avatar placeholder">
                                          <div className="w-6 h-6 rounded-full bg-success text-success-content text-xs">
                                            <span>
                                              {item.commentUpdatedByName
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                        <FaCommentDots className="shrink-0 w-5 h-5 text-success" />
                                      </>
                                    );
                                  }

                                  return (
                                    <FaCommentDots className="shrink-0 w-5 h-5 text-success" />
                                  );
                                })()}
                                <span className="sr-only">
                                  Kommentar vorhanden
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div
                            className="flex items-center gap-1"
                            data-no-card-click
                          >
                            <button
                              type="button"
                              className={[
                                "btn btn-sm btn-circle",
                                item.reaction === "like"
                                  ? "btn-success text-white"
                                  : "btn-ghost hover:btn-success hover:text-white",
                                !isSuperAdmin
                                  ? "opacity-50 cursor-not-allowed"
                                  : "",
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(item.id, "like");
                              }}
                              title={
                                isSuperAdmin
                                  ? "Gefällt mir"
                                  : "Faqat super_admin uchun"
                              }
                              disabled={deletingId === item.id || !isSuperAdmin}
                            >
                              <FaThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className={[
                                "btn btn-sm btn-circle",
                                item.reaction === "dislike"
                                  ? "btn-error text-white"
                                  : "btn-ghost hover:btn-error hover:text-white",
                                !isSuperAdmin
                                  ? "opacity-50 cursor-not-allowed"
                                  : "",
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(item.id, "dislike");
                              }}
                              title={
                                isSuperAdmin
                                  ? "Gefällt mir nicht"
                                  : "Faqat super_admin uchun"
                              }
                              disabled={deletingId === item.id || !isSuperAdmin}
                            >
                              <FaThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      }
                    />
                  );
                })()
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-base-content/70">
                  Seite {currentPage} von {totalPages} • Zeige {startIndex + 1}-
                  {Math.min(endIndex, filteredItems.length)} von{" "}
                  {filteredItems.length} Kandidaten
                </div>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and 2 pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis if there's a gap
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <span key={page}>
                          {showEllipsis && (
                            <button className="join-item btn btn-sm btn-disabled">
                              ...
                            </button>
                          )}
                          <button
                            className={`join-item btn btn-sm ${
                              currentPage === page ? "btn-active" : ""
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    className="join-item btn btn-sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CollectionCv;
