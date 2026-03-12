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
  FaStar,
  FaTrash,
  FaTelegram,
  FaThumbsUp,
  FaThumbsDown,
  FaFileExcel,
} from "react-icons/fa";
import { BsSendCheck } from "react-icons/bs";

import { HiMiniDocumentCheck } from "react-icons/hi2";
import {
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  getMetaByName,
  deleteEmailAndPassIdByEmail,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
  getUserByEmail,
  getUserFromFirestore,
} from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CandidateCard from "../components/CandidateCard";
import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../constants/candidateStatus";
import { hasRichTextContent } from "../utils/commentar";
import {
  exportCandidatesToExcel,
  exportFullCandidatesToExcel,
} from "../utils/excelExport";
import { getDocs } from "firebase/firestore";
import { formatRatingForUi, normalizeRating } from "./generate/utils/ratingUtils";
import CollectionFilters from "./candidates/components/CollectionFilters";
import CollectionStatistics from "./collectionCv/CollectionStatistics";
import CollectionPagination from "./collectionCv/CollectionPagination";

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
  const [commentAuthorFilter, setCommentAuthorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [stageOutcomeFilter, setStageOutcomeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [drivingFilter, setDrivingFilter] = useState("all");
  const [langLevelFilter, setLangLevelFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [reactionFilter, setReactionFilter] = useState("all");
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

  const filters = useMemo(
    () => ({
      certificate: certificateFilter,
      experience: experienceFilter,
      comment: commentFilter,
      stage: stageFilter,
      stageOutcome: stageOutcomeFilter,
      age: ageFilter,
      driving: drivingFilter,
      langLevel: langLevelFilter,
      rating: ratingFilter,
      reaction: reactionFilter,
    }),
    [
      certificateFilter,
      experienceFilter,
      commentFilter,
      stageFilter,
      stageOutcomeFilter,
      ageFilter,
      drivingFilter,
      langLevelFilter,
      ratingFilter,
      reactionFilter,
    ],
  );

  function setFilter(key, value) {
    const next = String(value || "all").trim();
    if (key === "certificate") setCertificateFilter(next);
    else if (key === "experience") setExperienceFilter(next);
    else if (key === "comment") setCommentFilter(next);
    else if (key === "stage") setStageFilter(next);
    else if (key === "stageOutcome") setStageOutcomeFilter(next);
    else if (key === "age") setAgeFilter(next);
    else if (key === "driving") setDrivingFilter(next);
    else if (key === "langLevel") setLangLevelFilter(next);
    else if (key === "rating") setRatingFilter(next);
    else if (key === "reaction") setReactionFilter(next);
  }

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
      toast.success(
        `${fullDocs.length} kandidat to'liq ma'lumotlari eksport qilindi.`,
      );
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

      if (commentAuthorFilter !== "all") {
        const authorName = String(it.commentUpdatedByName || "").trim();
        if (authorName !== commentAuthorFilter) return false;
      }

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

      if (ratingFilter === "with" && it.rating === null) return false;
      if (ratingFilter === "without" && it.rating !== null) return false;

      if (reactionFilter !== "all") {
        const wantedReaction = String(reactionFilter || "").trim();
        if (String(it.reaction || "").trim() !== wantedReaction) return false;
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
    commentAuthorFilter,
    stageFilter,
    stageOutcomeFilter,
    ageFilter,
    drivingFilter,
    langLevelFilter,
    ratingFilter,
    reactionFilter,
  ]);

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
    commentAuthorFilter,
    stageFilter,
    stageOutcomeFilter,
    ageFilter,
    drivingFilter,
    langLevelFilter,
    ratingFilter,
    reactionFilter,
  ]);

  const statistics = useMemo(() => {
    if (!items.length) return null;

    const total = items.length;
    const withEmail = items.filter(
      (item) => (item.emailSentCount || 0) > 0,
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

  const uniqueCommentAuthors = useMemo(() => {
    const authors = new Set();
    items.forEach((item) => {
      const name = String(item?.commentUpdatedByName || "").trim();
      if (name) authors.add(name);
    });
    return Array.from(authors).sort((a, b) => a.localeCompare(b));
  }, [items]);

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
                .toUpperCase(),
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
          const commentUpdatedByUid = commentMeta?.updatedByUid || "";
          const emailLastSentByUid = emailMeta?.lastSentByUid || "";
          const statusUpdatedByUid = data?.status?.updatedByUid || "";
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
          const rating = normalizeRating(data?.rating);
          const statusUpdatedBy = data?.status?.updatedBy || "";
          const emailLastSentBy = emailMeta?.lastSentBy || "";
          const commentUpdatedBy = commentMeta?.updatedBy || "";

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
            commentUpdatedByUid,
            emailLastSentByUid,
            statusUpdatedByUid,
            stageDecisions,
            telegramId: data.telegramId || null,
            lead: data.lead || null,
            reaction,
            rating,
            documentReady: data.documentReady || false,
            isDocumentSend: data.isDocumentSend || false,
          };
        });
        setItems(list);
        setLoading(false);
      },
      (err) => {
        toast.error("Fehler beim Laden der Daten.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, metaLoading, resolvingMajor]);

  // Fetch user photos from users collection based on UID
  useEffect(() => {
    if (!items || items.length === 0) return;

    const fetchUserPhotos = async () => {
      const uidsToFetch = new Set();
      const emailsToFetch = new Set();

      // Collect all unique UIDs and emails that need photo lookup
      items.forEach((item) => {
        // From commentMeta.updatedByUid
        const commentUid = item.commentUpdatedByUid || "";
        if (commentUid && !fetchedEmailsRef.current.has(commentUid)) {
          uidsToFetch.add(commentUid);
        }

        // From emailMeta.lastSentByUid
        const emailUid = item.emailLastSentByUid || "";
        if (emailUid && !fetchedEmailsRef.current.has(emailUid)) {
          uidsToFetch.add(emailUid);
        }

        // From status.updatedByUid
        const statusUid = item.statusUpdatedByUid || "";
        if (statusUid && !fetchedEmailsRef.current.has(statusUid)) {
          uidsToFetch.add(statusUid);
        }

        // Fallback: fetch by email if UID is not available
        const emailLastSentBy = item.emailLastSentBy || "";
        if (
          emailLastSentBy &&
          emailLastSentBy.includes("@") &&
          !item.emailLastSentByUid &&
          !fetchedEmailsRef.current.has(emailLastSentBy)
        ) {
          emailsToFetch.add(emailLastSentBy);
        }

        const commentUpdatedBy = item.commentUpdatedBy || "";
        if (
          commentUpdatedBy &&
          commentUpdatedBy.includes("@") &&
          !item.commentUpdatedByUid &&
          !fetchedEmailsRef.current.has(commentUpdatedBy)
        ) {
          emailsToFetch.add(commentUpdatedBy);
        }
      });

      if (uidsToFetch.size === 0 && emailsToFetch.size === 0) return;

      const newPhotos = {};

      // Fetch by UID
      for (const uid of uidsToFetch) {
        fetchedEmailsRef.current.add(uid);
        try {
          const userData = await getUserFromFirestore(uid);
          if (userData && (userData.avatar || userData.photoURL)) {
            newPhotos[uid] = userData.avatar || userData.photoURL;
          }
        } catch (error) {
          console.error(`Failed to fetch user photo for UID ${uid}:`, error);
        }
      }

      // Fallback: fetch by email for old data without UID
      for (const email of emailsToFetch) {
        fetchedEmailsRef.current.add(email);
        try {
          const userData = await getUserByEmail(email);
          if (userData && (userData.avatar || userData.photoURL)) {
            newPhotos[email] = userData.avatar || userData.photoURL;
          }
        } catch (error) {
          console.error(
            `Failed to fetch user photo for email ${email}:`,
            error,
          );
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
            : "Reaktion entfernt",
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

        <CollectionStatistics
          title={title}
          statistics={statistics}
          leadStats={leadStats}
          loading={loading}
          items={items}
          uniqueCommentAuthors={uniqueCommentAuthors}
          commentAuthorFilter={commentAuthorFilter}
          setCommentAuthorFilter={setCommentAuthorFilter}
        />

        <CollectionFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilter={setFilter}
        />

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
                          }`,
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
                              title="Das Dokument ist fertig"
                            >
                              <HiMiniDocumentCheck className="w-4 h-4" />
                            </span>
                          ) : null}
                          {item.isDocumentSend ? (
                            <span
                              className="inline-flex items-center gap-1 text-blue-500"
                              title="Das Dokument wurde gesendet."
                            >
                              <BsSendCheck className="w-3.5 h-3.5" />
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
                            {item.rating !== null ? (
                              <div
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60"
                                title={`Bewertung: ${formatRatingForUi(item.rating)}`}
                              >
                                <FaStar className="shrink-0 w-4 h-4 text-warning" />
                                <span className="tabular-nums text-sm font-semibold">
                                  {formatRatingForUi(item.rating)}
                                </span>
                              </div>
                            ) : null}
                            <div
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60"
                              title={
                                item.emailSentCount > 0
                                  ? `E-Mails gesendet: ${
                                      item.emailSentCount || 0
                                    }${
                                      item.emailLastSentAt
                                        ? ` • Zuletzt: ${formatCreatedAt(
                                            item.emailLastSentAt,
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
                                // Priority: 1) userPhotosCache by UID, 2) userPhotosCache by email, 3) emailLastSentByPhoto, 4) initials
                                const photoFromCache =
                                  userPhotosCache[item.emailLastSentByUid] ||
                                  userPhotosCache[item.emailLastSentBy] ||
                                  null;
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
                                        item.commentUpdatedAt,
                                      )}${
                                        item.commentUpdatedByName
                                          ? ` • Von: ${item.commentUpdatedByName}`
                                          : ""
                                      }`
                                    : "Kommentar vorhanden"
                                }
                              >
                                {(() => {
                                  // Priority: 1) userPhotosCache by UID, 2) userPhotosCache by email, 3) commentUpdatedByPhoto, 4) initials
                                  const photoFromCache =
                                    userPhotosCache[item.commentUpdatedByUid] ||
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
                })(),
              )}
            </div>

            <CollectionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredItems.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default CollectionCv;
