import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import {
  FaCommentDots,
  FaEnvelope,
  FaPhone,
  FaTrash,
} from "react-icons/fa";
import {
  deleteCandidateWithCurrentStats,
  deleteEmailRemote,
  deleteUploadedFilesRemote,
  getDocumentDataById,
  getMetaByName,
} from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CollapsibleSection from "../components/CollapsibleSection";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../constants/candidateStatus";
import { hasRichTextContent } from "../utils/commentar";

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
  const [stageFilter, setStageFilter] = useState("all");
  const [stageOutcomeFilter, setStageOutcomeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [drivingFilter, setDrivingFilter] = useState("all");
  const [langLevelFilter, setLangLevelFilter] = useState("all");
  const { role } = useUserRole();
  const isLimitedAdmin = role === "limited_admin";
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      return new Intl.DateTimeFormat("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }, [metaInfo]);

  const majorCreatedByLabel = useMemo(() => {
    const v = String(metaInfo?.createdBy || "").trim();
    return v || "tizim";
  }, [metaInfo]);

  function formatCreatedAt(value) {
    const d = toDateFromMetaCreatedAt(value);
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
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

      if (stageFilter !== "all") {
        if (String(it.statusValue || "").trim() !== String(stageFilter || "").trim())
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
    stageFilter,
    stageOutcomeFilter,
    ageFilter,
    drivingFilter,
    langLevelFilter,
  ]);

  const hasActiveFilters =
    certificateFilter !== "all" ||
    experienceFilter !== "all" ||
    stageFilter !== "all" ||
    stageOutcomeFilter !== "all" ||
    ageFilter !== "all" ||
    drivingFilter !== "all" ||
    langLevelFilter !== "all" ||
    Boolean(searchQuery.trim());

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (certificateFilter !== "all") count++;
    if (experienceFilter !== "all") count++;
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
    drivingFilter,
    experienceFilter,
    langLevelFilter,
    stageFilter,
    stageOutcomeFilter,
    searchQuery,
  ]);

  const certificateTabs = [
    { value: "all", label: "Barchasi" },
    { value: "with", label: "Sertifikat bor" },
    { value: "without", label: "Sertifikat yo'q" },
  ];

  const experienceTabs = [
    { value: "all", label: "Barchasi" },
    { value: "with", label: "Tajriba bor" },
    { value: "without", label: "Tajriba yo'q" },
  ];

  const stageTabs = [
    { value: "all", label: "Barchasi" },
    ...CANDIDATE_STATUS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  ];

  const stageOutcomeTabs = [
    { value: "all", label: "Barchasi" },
    { value: "stage_1:accepted", label: "1-bosqich: qabul qilindi" },
    { value: "stage_1:rejected", label: "1-bosqich: rad qilindi" },
    { value: "stage_2:accepted", label: "2-bosqich: qabul qilindi" },
    { value: "stage_2:rejected", label: "2-bosqich: rad qilindi" },
    { value: "stage_3:accepted", label: "3-bosqich: qabul qilindi" },
    { value: "stage_3:rejected", label: "3-bosqich: rad qilindi" },
    { value: "stage_4:accepted", label: "Ish beruvchi: qabul qildi" },
    { value: "stage_4:rejected", label: "Ish beruvchi: rad qildi" },
  ];

  const ageTabs = [
    { value: "all", label: "Barcha yosh" },
    { value: "18_25", label: "18-25" },
    { value: "26_35", label: "26-35" },
    { value: "36_45", label: "36-45" },
    { value: "46_plus", label: "46+" },
  ];

  const ageFilterLabel =
    ageTabs.find((t) => t.value === ageFilter)?.label || "Barchasi";

  const drivingTabs = [
    { value: "all", label: "Barchasi" },
    { value: "with", label: "Prava bor" },
    { value: "without", label: "Prava yo'q" },
  ];

  const langLevelTabs = [
    { value: "all", label: "Barchasi" },
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "C1", label: "C1" },
    { value: "C2", label: "C2" },
  ];

  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (searchQuery.trim()) {
      badges.push({
        key: "search",
        label: `Qidiruv: ${searchQuery.trim()}`,
        onClear: () => setSearchQuery(""),
      });
    }

    if (certificateFilter !== "all") {
      const label =
        certificateTabs.find((t) => t.value === certificateFilter)?.label ||
        certificateFilter;
      badges.push({
        key: "certificate",
        label: `Sertifikat: ${label}`,
        onClear: () => setCertificateFilter("all"),
      });
    }

    if (experienceFilter !== "all") {
      const label =
        experienceTabs.find((t) => t.value === experienceFilter)?.label ||
        experienceFilter;
      badges.push({
        key: "experience",
        label: `Tajriba: ${label}`,
        onClear: () => setExperienceFilter("all"),
      });
    }

    if (stageFilter !== "all") {
      const label =
        stageTabs.find((t) => t.value === stageFilter)?.label || stageFilter;
      badges.push({
        key: "stage",
        label: `Bosqich: ${label}`,
        onClear: () => setStageFilter("all"),
      });
    }

    if (stageOutcomeFilter !== "all") {
      const label =
        stageOutcomeTabs.find((t) => t.value === stageOutcomeFilter)?.label ||
        stageOutcomeFilter;
      badges.push({
        key: "stageOutcome",
        label: `Natija: ${label}`,
        onClear: () => setStageOutcomeFilter("all"),
      });
    }

    if (ageFilter !== "all") {
      const label = ageTabs.find((t) => t.value === ageFilter)?.label || ageFilter;
      badges.push({
        key: "age",
        label: `Yosh: ${label}`,
        onClear: () => setAgeFilter("all"),
      });
    }

    if (drivingFilter !== "all") {
      const label =
        drivingTabs.find((t) => t.value === drivingFilter)?.label || drivingFilter;
      badges.push({
        key: "driving",
        label: `Haydovchilik: ${label}`,
        onClear: () => setDrivingFilter("all"),
      });
    }

    if (langLevelFilter !== "all") {
      const label =
        langLevelTabs.find((t) => t.value === langLevelFilter)?.label ||
        langLevelFilter;
      badges.push({
        key: "langLevel",
        label: `Til: ${label}`,
        onClear: () => setLangLevelFilter("all"),
      });
    }

    return badges;
  }, [
    ageFilter,
    certificateFilter,
    certificateTabs,
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
    const q = query(collection(db, name), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          const attachments = data.attachments || {};
          const langCerts = Array.isArray(attachments?.languageCertificates)
            ? attachments.languageCertificates
            : [];
          const extraCerts = Array.isArray(attachments?.certificates)
            ? attachments.certificates
            : [];
          const hasCertificate =
            langCerts.length > 0 || extraCerts.length > 0;
          const hasExperience =
            Array.isArray(data.berufserfahrung) &&
            data.berufserfahrung.length > 0;
          const langLevels = Object.values(
            data.faehigkeiten?.sprachen || {}
          )
            .map((lv) => String(lv || "").trim().toUpperCase())
            .filter((lv) => ["A1", "A2", "B1", "B2", "C1", "C2"].includes(lv));
          const pd = data.persoenlicheDaten || {};
          const firstName = String(pd.name || "").trim();
          const lastName = String(pd.nachname || "").trim();
          const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
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
          const hasComment = hasRichTextContent(data?.commentar);
          const commentMeta = data?.commentarMeta || {};
          const stageMeta =
            data?.stageMeta && typeof data.stageMeta === "object" ? data.stageMeta : {};
          const stageDecisions = {};
          for (const k of ["stage_1", "stage_2", "stage_3", "stage_4"]) {
            const raw = stageMeta?.[k]?.decision;
            if (raw === "accepted" || raw === "rejected") {
              stageDecisions[k] = raw;
            }
          }
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
            emailSentCount,
            emailLastSentAt,
            hasComment,
            commentUpdatedAt: commentMeta?.updatedAt || null,
            stageDecisions,
          };
        });
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Fehler beim Laden der Daten.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, metaLoading, resolvingMajor]);

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

      // 0) Load full candidate doc so we can delete uploaded documents as well
      const full = await getDocumentDataById(colName, itemId);
      const att = full?.attachments || {};
      const docs = full?.documents || {};
      const urls = [
        ...(Array.isArray(att?.diplomas) ? att.diplomas : []),
        ...(Array.isArray(att?.languageCertificates) ? att.languageCertificates : []),
        ...(Array.isArray(att?.certificates) ? att.certificates : []),
        ...(Array.isArray(docs?.diplomas) ? docs.diplomas : []),
        ...(Array.isArray(docs?.certificates) ? docs.certificates : []),
      ];
      if (urls.length > 0) {
        await deleteUploadedFilesRemote(urls);
      }

      // 1) Delete candidate email from external API
      const targetEmail = String(deleteTarget?.email || "").trim();
      if (targetEmail) {
        await deleteEmailRemote(targetEmail);
      }

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });
      toast.success("Kandidat erfolgreich gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="mx-auto">
        <DeleteCandidateModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          candidateName={deleteTarget?.name}
          isDeleting={Boolean(deletingId)}
          seconds={5}
        />
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Berufsfeld: <span className="text-primary">{title}</span>
            </h1>
            <p className="text-sm opacity-70">
              Gefunden: {loading ? "..." : filteredItems.length} Kandidaten
            </p>
            <p className="text-sm opacity-70">
              Bo&apos;lim ochilgan: {metaLoading ? "..." : majorCreatedAtLabel}
            </p>
            <p className="text-sm opacity-70">
              Kim tomonidan: {metaLoading ? "..." : majorCreatedByLabel}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <input
              type="search"
              id="search"
              name="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-64"
              placeholder="Nach Name suchen..."
              aria-label="Nach Name suchen"
            />
          </div>
        </div>

        <div className="mb-6">
          {activeFilterBadges.length > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-base-content/60">
                Tanlangan filtrlar:
              </span>
              {activeFilterBadges.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  className="badge badge-outline gap-2 py-3 cursor-pointer hover:bg-base-200"
                  title="Filtrni o‘chirish"
                  onClick={b.onClear}
                >
                  <span className="truncate max-w-[240px] sm:max-w-[320px]">
                    {b.label}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : null}
          <CollapsibleSection
            title="Filtrlar"
            defaultOpen={false}
            className="shadow-md border-base-300/60"
            meta={`${activeFilterCount} aktiv`}
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Sertifikat, tajriba va yosh bo‘yicha tezkor tanlash.
                  </p>
                  <p className="text-xs text-base-content/60">
                    Haydovchilik guvohnomasi va til darajasi bo‘yicha ham
                    saralash.
                  </p>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setCertificateFilter("all");
                      setExperienceFilter("all");
                      setStageFilter("all");
                      setStageOutcomeFilter("all");
                      setAgeFilter("all");
                      setDrivingFilter("all");
                      setLangLevelFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    Filtrlarni tozalash
                  </button>
                ) : (
                  <span className="badge badge-ghost">Filtr yo‘q</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Sertifikat:
                </span>
                {certificateTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(certificateFilter === tab.value)}
                    onClick={() => setCertificateFilter(tab.value)}
                    type="button"
                  >
                    {certificateFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Tajriba:
                </span>
                {experienceTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(experienceFilter === tab.value)}
                    onClick={() => setExperienceFilter(tab.value)}
                    type="button"
                  >
                    {experienceFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Bosqich:
                </span>
                {stageTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(stageFilter === tab.value)}
                    onClick={() => setStageFilter(tab.value)}
                    type="button"
                  >
                    {stageFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Natija:
                </span>
                {stageOutcomeTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(stageOutcomeFilter === tab.value)}
                    onClick={() => setStageOutcomeFilter(tab.value)}
                    type="button"
                  >
                    {stageOutcomeFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Yosh:
                </span>
                {ageTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(ageFilter === tab.value)}
                    onClick={() => setAgeFilter(tab.value)}
                    type="button"
                  >
                    {ageFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Haydovchilik:
                </span>
                {drivingTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(drivingFilter === tab.value)}
                    onClick={() => setDrivingFilter(tab.value)}
                    type="button"
                  >
                    {drivingFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                  Til darajasi:
                </span>
                {langLevelTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={chipClass(langLevelFilter === tab.value)}
                    onClick={() => setLangLevelFilter(tab.value)}
                    type="button"
                  >
                    {langLevelFilter === tab.value ? "●" : "○"} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <span className="loading loading-spinner loading-lg text-primary"></span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              (() => {
                const accentClass =
                  item.statusTone === "success"
                    ? "border-l-success"
                    : item.statusTone === "warning"
                    ? "border-l-warning"
                    : item.statusTone === "primary"
                    ? "border-l-primary"
                    : "border-l-info";

                return (
              <div
                key={item.id}
                className={`card bg-base-100 border border-base-300/60 border-l-4 ${accentClass} shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer h-full flex flex-col relative overflow-hidden`}
                onClick={() =>
                  navigate(`/generate/${resolvedMajor.linkId || major}/${item.id}`)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/generate/${resolvedMajor.linkId || major}/${item.id}`);
                  }
                }}
              >
                <div className="card-body p-4 sm:p-5 flex flex-col h-full gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-base-200 ring-1 ring-base-300">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.name || "Foto"}
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="font-semibold leading-tight truncate"
                          title={item.name || "Ohne Namen"}
                        >
                          {item.name || "Ohne Namen"}
                        </h2>
                        {typeof item.age === "number" && item.age >= 1 ? (
                          <div className="mt-0.5 text-xs text-base-content/70">
                            {item.age} yosh
                          </div>
                        ) : null}
                        <div className="mt-0.5 text-xs text-base-content/60 flex flex-wrap items-center gap-2">
                          <span>{formatCreatedAt(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isLimitedAdmin && (
                    <div className="absolute top-2 right-2">
                      <button
                        className="btn btn-ghost btn-circle btn-sm text-error/70 hover:text-error hover:bg-error/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(item);
                        }}
                        disabled={deletingId === item.id}
                        title="Löschen"
                      >
                        {deletingId === item.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FaTrash size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="mt-1 space-y-2 text-sm w-full">
                    {item.phone && (
                      <div className="flex items-center gap-3 text-base-content/80 overflow-hidden">
                        <FaPhone className="shrink-0 text-base-content/50 w-4" />
                        <span
                          className="truncate font-medium"
                          title={item.phone}
                        >
                          {item.phone}
                        </span>
                      </div>
                    )}

                    {item.email && (
                      <div className="flex items-center gap-3 text-base-content/80 overflow-hidden">
                        <FaEnvelope className="shrink-0 text-base-content/50 w-4" />
                        <span
                          className="truncate font-medium"
                          title={item.email}
                        >
                          {item.email}
                        </span>
                      </div>
                    )}

                    {/* Agar ma'lumotlar bo'lmasa bo'sh joy ko'rsatmaslik uchun */}
                    {!item.phone && !item.email && (
                      <div className="text-center text-xs text-base-content/40 py-2">
                        Keine Kontaktdaten
                      </div>
                    )}
                  </div>

                  {/* Bottom: email + comment (important) */}
                  <div className="mt-auto pt-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60 w-fit max-w-full"
                        title={
                          (item.emailSentCount || 0) > 0
                            ? `Email jo'natilgan: ${item.emailSentCount || 0} ta${
                                item.emailLastSentAt
                                  ? ` • Oxirgi: ${formatCreatedAt(
                                      item.emailLastSentAt
                                    )}`
                                  : ""
                              }`
                            : "Email jo'natilmagan: 0 ta"
                        }
                      >
                        <FaEnvelope className="shrink-0 w-4 h-4 text-base-content/50" />
                        <span className="tabular-nums text-sm font-semibold">
                          {item.emailSentCount || 0}
                        </span>
                      </div>

                      {item.hasComment ? (
                        <div
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-base-300/60 bg-base-100/60"
                          title={
                            item.commentUpdatedAt
                              ? `Komment yangilandi: ${formatCreatedAt(
                                  item.commentUpdatedAt
                                )}`
                              : "Komment bor"
                          }
                        >
                          <FaCommentDots className="w-4 h-4 text-success" />
                          <span className="sr-only">Komment bor</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {deletingId === item.id && (
                  <div className="absolute inset-0 bg-base-100/80 backdrop-blur-[1px] grid place-items-center z-20">
                    <span className="loading loading-spinner loading-md text-primary" />
                  </div>
                )}
              </div>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionCv;
