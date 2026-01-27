import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  subscribeToCollections,
  getMetaByName,
  updateMetaByName,
} from "../utils";
import { Link } from "react-router-dom";
import {
  FaCog,
  FaRegCopy,
  FaTrash,
  FaLink,
  FaComments,
  FaBuilding,
  FaTelegramPlane,
} from "react-icons/fa";
import { FaUserTie } from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserRole } from "../hooks/useUserRole";
import { sendBrevoEmail } from "../utils/brevo";
import {
  generateTelegramInviteLink,
  trackTelegramInviteSent,
} from "../utils/telegramInvites";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import LinkCopyModal from "./LinkCopyModal";

function toInputDateString(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // yyyy-mm-ddThh:mm (datetime-local)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    // dd.mm.yyyy -> yyyy-mm-dd
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  }
  if (typeof value === "number") {
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }
  return "";
}

function resolveLinkType(rawType, link) {
  const normalizedType = String(rawType || "").toLowerCase();
  if (normalizedType === "telegram") return "telegram";
  const rawLink = String(link || "").toLowerCase();
  if (rawLink.includes("t.me/") || rawLink.includes("telegram"))
    return "telegram";
  return "zoom";
}

// Create-link origin (manual switch):
// Local test:
// const CREATE_LINK_ORIGIN = "http://localhost:5173";
// Production:
const CREATE_LINK_ORIGIN = "https://admin.consultinguz.de";

function buildCreateLink(major, lead) {
  const linkId =
    major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  if (!linkId) return "";
  const origin = CREATE_LINK_ORIGIN;
  try {
    const url = new URL(`${origin}/create`);
    url.searchParams.set("major", String(linkId));
    const leadStr = String(lead || "").trim();
    if (leadStr) url.searchParams.set("lead", leadStr);
    return url.toString();
  } catch {
    // Fallback (should be rare)
    const base = `${origin}/create?major=${encodeURIComponent(String(linkId))}`;
    const leadStr = String(lead || "").trim();
    return leadStr ? `${base}&lead=${encodeURIComponent(leadStr)}` : base;
  }
}

function generateLocalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeLeadLinkRow(raw, idx) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const name = String(obj?.name || "").trim();
  if (!name) return null;
  const id = String(obj?.id || obj?.key || "").trim() || `row_${idx}`;
  const active = obj?.active !== false;
  return { id, name, active };
}

function MajorSettingsModal({
  open,
  major,
  majorKey,
  onClose,
  onCopyLink,
  onToggleLinkActive,
  isTogglingLink,
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const title =
    major?.title ||
    major?.collectionName ||
    major?.slug ||
    major?.name ||
    String(major || "");
  const isLinkActive = major?.linkActive !== false;
  const createLink = buildCreateLink(major);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLeads, setIsSavingLeads] = useState(false);
  const [tab, setTab] = useState("link"); // link | internal | employer
  const tabLabel =
    tab === "link"
      ? "Link"
      : tab === "internal"
      ? "Ichki suxbat"
      : "Ish beruvchi";

  const [internalDate, setInternalDate] = useState("");
  const [internalLink, setInternalLink] = useState("");
  const [internalLinkType, setInternalLinkType] = useState("zoom");
  const [internalLocationName, setInternalLocationName] = useState("");
  const [internalLocationUrl, setInternalLocationUrl] = useState("");

  const [leadershipDate, setLeadershipDate] = useState("");
  const [leadershipLink, setLeadershipLink] = useState("");
  const [leadershipLinkType, setLeadershipLinkType] = useState("zoom");
  const [leadershipLocationName, setLeadershipLocationName] = useState("");
  const [leadershipLocationUrl, setLeadershipLocationUrl] = useState("");

  const [employerDate, setEmployerDate] = useState("");
  const [employerLink, setEmployerLink] = useState("");
  const [employerLinkType, setEmployerLinkType] = useState("zoom");
  const [employerLocationName, setEmployerLocationName] = useState("");
  const [employerLocationUrl, setEmployerLocationUrl] = useState("");

  const [metaName, setMetaName] = useState("");
  const [metaSlug, setMetaSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaValidationError, setMetaValidationError] = useState("");
  const [candidateCount, setCandidateCount] = useState(0);
  const [checkingCandidates, setCheckingCandidates] = useState(false);

  const [leadLinksActive, setLeadLinksActive] = useState(true);
  const [leadLinks, setLeadLinks] = useState([]);
  const [newLeadName, setNewLeadName] = useState("");
  const [deleteLead, setDeleteLead] = useState(null); // { id, name }

  // ---- Telegram groups (used for interview link shortcuts) ----
  const [tgGroups, setTgGroups] = useState([]);
  const [internalTelegramGroupId, setInternalTelegramGroupId] = useState("");
  const [leadershipTelegramGroupId, setLeadershipTelegramGroupId] =
    useState("");
  const [employerTelegramGroupId, setEmployerTelegramGroupId] = useState("");
  const [inviteCopyLoading, setInviteCopyLoading] = useState({
    internal: false,
    leadership: false,
    employer: false,
  });

  const resolveMajorCollectionName = (m) => {
    return String(m?.collectionName || m?.slug || m?.name || "").trim();
  };

  const extractEmailFromCandidate = (payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const email =
      p?.persoenlicheDaten?.email ??
      p?.personalInfo?.email ??
      p?.personalData?.email ??
      p?.email ??
      "";
    return String(email || "")
      .trim()
      .toLowerCase();
  };

  async function loadTelegramGroupsOnce() {
    try {
      const q = query(
        collection(db, "telegram_groups"),
        where("active", "==", true),
        limit(200)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      setTgGroups(list);
    } catch (e) {
      setTgGroups([]);
    }
  }

  useEffect(() => {
    if (!open || !majorKey) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getMetaByName(majorKey);
        if (cancelled) return;
        setTab("link");
        setInternalDate(toInputDateString(data?.interviewInternal?.date));
        setInternalLink(String(data?.interviewInternal?.link || ""));
        setInternalLinkType(
          resolveLinkType(
            data?.interviewInternal?.linkType,
            data?.interviewInternal?.link
          )
        );
        setInternalLocationName(
          String(data?.interviewInternal?.locationName || "")
        );
        setInternalLocationUrl(
          String(data?.interviewInternal?.locationUrl || "")
        );

        // Leadership (Orif Aka)
        setLeadershipDate(toInputDateString(data?.interviewLeadership?.date));
        setLeadershipLink(String(data?.interviewLeadership?.link || ""));
        setLeadershipLinkType(
          resolveLinkType(
            data?.interviewLeadership?.linkType,
            data?.interviewLeadership?.link
          )
        );
        setLeadershipLocationName(
          String(data?.interviewLeadership?.locationName || "")
        );
        setLeadershipLocationUrl(
          String(data?.interviewLeadership?.locationUrl || "")
        );

        setEmployerDate(toInputDateString(data?.interviewEmployer?.date));
        setEmployerLink(String(data?.interviewEmployer?.link || ""));
        setEmployerLinkType(
          resolveLinkType(
            data?.interviewEmployer?.linkType,
            data?.interviewEmployer?.link
          )
        );
        setEmployerLocationName(
          String(data?.interviewEmployer?.locationName || "")
        );
        setEmployerLocationUrl(
          String(data?.interviewEmployer?.locationUrl || "")
        );
        setInternalTelegramGroupId(
          String(data?.interviewInternal?.telegramGroupId || "").trim()
        );
        setLeadershipTelegramGroupId(
          String(data?.interviewLeadership?.telegramGroupId || "").trim()
        );
        setEmployerTelegramGroupId(
          String(data?.interviewEmployer?.telegramGroupId || "").trim()
        );

        setMetaName(String(data?.name || "").trim());
        setMetaSlug(String(data?.slug || "").trim());
        setMetaTitle(String(data?.title || "").trim());
        setMetaValidationError("");

        // Check if candidates exist for this Berufsfeld
        setCheckingCandidates(true);
        try {
          const colName = resolveMajorCollectionName(major);
          if (colName) {
            const countSnap = await getCountFromServer(collection(db, colName));
            setCandidateCount(countSnap.data().count || 0);
          } else {
            setCandidateCount(0);
          }
        } catch (e) {
          setCandidateCount(0);
        } finally {
          setCheckingCandidates(false);
        }

        setLeadLinksActive(data?.leadLinksActive !== false);
        const rows = Array.isArray(data?.leadLinks) ? data.leadLinks : [];
        const normalized = rows
          .map((r, idx) => normalizeLeadLinkRow(r, idx))
          .filter(Boolean);
        setLeadLinks(normalized);
        setNewLeadName("");
        setDeleteLead(null);

        // Load Telegram groups (active only) for bulk email.
        loadTelegramGroupsOnce();
      } catch (e) {
        if (!cancelled) {
          toast.error("Meta-Daten konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, majorKey]);

  async function sendTelegramInvitesToAllUsers() {
    if (!major) return;
    if (tgSendingLock.current) {
      toast("Jarayon ketmoqda, iltimos kuting...");
      return;
    }
    const colName = resolveMajorCollectionName(major);
    if (!colName) {
      toast.error("Berufsfeld collection aniqlanmadi.");
      return;
    }
    const safeGroupId = String(tgGroupId || "").trim();
    if (!safeGroupId) {
      toast.error("Telegram guruh tanlang.");
      return;
    }
    const subject = String(tgSubject || "").trim();
    if (!subject) {
      toast.error("Email subject bo‘sh bo‘lmasin.");
      return;
    }
    const bodyTemplate = String(tgBody || "").trim();
    if (!bodyTemplate || !bodyTemplate.includes("{{invite_link}}")) {
      toast.error("Email body ichida {{invite_link}} bo‘lishi kerak.");
      return;
    }

    const ok = window.confirm(
      `Hamma foydalanuvchilarga Telegram invite link yuborilsinmi?\n\nCollection: ${colName}\nGroup: ${safeGroupId}\n\nEslatma: har bir email uchun alohida 1-martalik link yaratiladi.`
    );
    if (!ok) return;

    tgSendingLock.current = true;
    setTgSending(true);
    try {
      const snap = await getDocs(collection(db, colName));
      const emails = Array.from(
        new Set(
          snap.docs
            .map((d) => extractEmailFromCandidate(d.data()))
            .filter((e) => e && e.includes("@"))
        )
      );

      if (emails.length === 0) {
        toast.error("Keine E-Mails in dieser Sammlung gefunden.");
        return;
      }

      const concurrency = 3;
      let idx = 0;
      let sent = 0;
      let failed = 0;

      async function worker() {
        while (idx < emails.length) {
          const i = idx++;
          const to = emails[i];
          try {
            const { invite_link } = await generateTelegramInviteLink({
              groupId: safeGroupId,
            });
            const body = bodyTemplate.replace("{{invite_link}}", invite_link);
            await sendBrevoEmail({
              to,
              subject,
              message: body,
              htmlContent: undefined,
            });
            sent += 1;
          } catch (e) {
            failed += 1;
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(concurrency, emails.length) }, () =>
          worker()
        )
      );

      // Track how many invites were actually sent successfully (single batched increment).
      try {
        if (sent > 0) {
          await trackTelegramInviteSent({ groupId: safeGroupId, count: sent });
        }
      } catch (e) {}

      toast.success(
        `Fertig: gesendet=${sent}, fehler=${failed}, gesamt=${emails.length}`
      );
    } finally {
      setTgSending(false);
      tgSendingLock.current = false;
    }
  }

  const handleGenerateAndCopyInvite = async (groupId, scope) => {
    const safe = String(groupId || "").trim();
    if (!safe) {
      toast.error("Telegram group tanlanmagan.");
      return;
    }
    setInviteCopyLoading((p) => ({ ...p, [scope]: true }));
    try {
      const { invite_link } = await generateTelegramInviteLink({
        groupId: safe,
      });
      await navigator.clipboard.writeText(invite_link);
      toast.success("Invite link nusxalandi.");
    } catch (e) {
      toast.error("Invite link yaratib bo'lmadi.");
    } finally {
      setInviteCopyLoading((p) => ({ ...p, [scope]: false }));
    }
  };

  const persistLeadSettings = async (nextLeadLinks, nextLeadLinksActive) => {
    if (!majorKey) return;
    setIsSavingLeads(true);
    try {
      const now = Date.now();
      await updateMetaByName(majorKey, {
        leadLinks: Array.isArray(nextLeadLinks) ? nextLeadLinks : [],
        leadLinksActive: nextLeadLinksActive !== false,
        updatedAt: now,
      });
      toast.success("Lead-Links wurden gespeichert.");
    } catch (e) {
      toast.error("Fehler beim Speichern der Lead-Links.");
    } finally {
      setIsSavingLeads(false);
    }
  };

  const handleAddLead = async () => {
    const name = String(newLeadName || "").trim();
    if (!name) {
      toast.error("Bitte geben Sie den Lead-Namen ein.");
      return;
    }
    const exists = (leadLinks || []).some(
      (l) =>
        String(l?.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      toast.error("Ein solcher Lead existiert bereits.");
      return;
    }

    const newLead = {
      id: generateLocalId(),
      name,
      active: true,
    };

    const next = [...(Array.isArray(leadLinks) ? leadLinks : []), newLead];
    setLeadLinks(next);
    setNewLeadName("");
    await persistLeadSettings(next, leadLinksActive);

    toast.success("Lead qo'shildi!");
  };

  const handleToggleLeadActive = async (id, checked) => {
    const next = (Array.isArray(leadLinks) ? leadLinks : []).map((l) =>
      l?.id === id ? { ...(l || {}), active: Boolean(checked) } : l
    );
    setLeadLinks(next);
    await persistLeadSettings(next, leadLinksActive);
  };

  const handleRemoveLead = async (id) => {
    const next = (Array.isArray(leadLinks) ? leadLinks : []).filter(
      (l) => l?.id !== id
    );
    setLeadLinks(next);
    await persistLeadSettings(next, leadLinksActive);
  };

  const handleSave = async () => {
    if (!majorKey) return;
    setIsSaving(true);
    try {
      const now = Date.now();
      const normalizeLocation = (name, url) => {
        const n = String(name || "").trim();
        const u = String(url || "").trim();
        return n || u;
      };
      await updateMetaByName(majorKey, {
        interviewInternal: {
          date: internalDate || "",
          link: internalLink || "",
          linkType: internalLinkType || "zoom",
          locationName: normalizeLocation(
            internalLocationName,
            internalLocationUrl
          ),
          locationUrl: internalLocationUrl || "",
          telegramGroupId:
            internalLinkType === "telegram"
              ? internalTelegramGroupId || ""
              : "",
          updatedAt: now,
        },
        interviewLeadership: {
          date: leadershipDate || "",
          link: leadershipLink || "",
          linkType: leadershipLinkType || "zoom",
          locationName: normalizeLocation(
            leadershipLocationName,
            leadershipLocationUrl
          ),
          locationUrl: leadershipLocationUrl || "",
          telegramGroupId:
            leadershipLinkType === "telegram"
              ? leadershipTelegramGroupId || ""
              : "",
          updatedAt: now,
        },
        interviewEmployer: {
          date: employerDate || "",
          link: employerLink || "",
          linkType: employerLinkType || "zoom",
          locationName: normalizeLocation(
            employerLocationName,
            employerLocationUrl
          ),
          locationUrl: employerLocationUrl || "",
          telegramGroupId:
            employerLinkType === "telegram"
              ? employerTelegramGroupId || ""
              : "",
          updatedAt: now,
        },
        updatedAt: now,
      });
      toast.success("Zusätzliche Informationen gespeichert!");
    } catch (e) {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        }}
      />
      <div
        className="relative w-full max-w-5xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="major-settings-title"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-xl overflow-hidden">
          <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 id="major-settings-title" className="text-lg font-semibold">
                <span className="text-primary">{title}</span>{" "}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose?.();
                }}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex max-h-[75vh] min-h-[60vh]">
            {/* Left sidebar nav */}
            <aside className="w-56 shrink-0 border-r border-base-300 p-3">
              <ul className="menu bg-base-100 rounded-box p-2 w-full gap-1">
                <li>
                  <button
                    type="button"
                    className={`w-full justify-start gap-2 ${
                      tab === "link"
                        ? "bg-neutral text-neutral-content font-semibold"
                        : ""
                    }`}
                    onClick={() => setTab("link")}
                  >
                    <FaLink
                      className={`text-lg ${
                        tab === "link"
                          ? "text-neutral-content"
                          : "text-base-content/70"
                      }`}
                    />
                    Link
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`w-full justify-start gap-2 ${
                      tab === "internal"
                        ? "bg-neutral text-neutral-content font-semibold"
                        : ""
                    }`}
                    onClick={() => setTab("internal")}
                  >
                    <FaComments
                      className={`text-lg ${
                        tab === "internal"
                          ? "text-neutral-content"
                          : "text-base-content/70"
                      }`}
                    />
                    Ichki suxbat
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`w-full justify-start gap-2 ${
                      tab === "leadership"
                        ? "bg-neutral text-neutral-content font-semibold"
                        : ""
                    }`}
                    onClick={() => setTab("leadership")}
                  >
                    <FaUserTie
                      className={`text-lg ${
                        tab === "leadership"
                          ? "text-neutral-content"
                          : "text-base-content/70"
                      }`}
                    />
                    Orif Aka bilan suxbat
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`w-full justify-start gap-2 ${
                      tab === "employer"
                        ? "bg-neutral text-neutral-content font-semibold"
                        : ""
                    }`}
                    onClick={() => setTab("employer")}
                  >
                    <FaBuilding
                      className={`text-lg ${
                        tab === "employer"
                          ? "text-neutral-content"
                          : "text-base-content/70"
                      }`}
                    />
                    Ish beruvchi
                  </button>
                </li>
              </ul>
            </aside>

            {/* Right content */}
            <section className="flex-1 min-w-0 flex flex-col">
              <div className="p-4 overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="py-6 text-sm opacity-70">Wird geladen...</div>
                ) : tab === "link" ? (
                  <div className="space-y-4">
                    {candidateCount === 0 && !checkingCandidates && (
                      <div className="rounded-lg border border-base-300 bg-base-200/20 p-4 space-y-4">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            Yo'nalish ma'lumotlari
                          </div>
                        </div>

                        {metaValidationError && (
                          <div className="alert alert-error">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="stroke-current shrink-0 h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{metaValidationError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <div className="form-control">
                            <label className="label" htmlFor="meta-name">
                              <span className="label-text">
                                Name (ichki nom)
                              </span>
                            </label>
                            <input
                              id="meta-name"
                              type="text"
                              className="input input-bordered w-full"
                              placeholder="masalan: pflegefachkraft"
                              value={metaName}
                              onChange={(e) => {
                                setMetaName(e.target.value);
                                setMetaValidationError("");
                              }}
                              disabled={isSavingMeta}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label" htmlFor="meta-slug">
                              <span className="label-text">
                                Slug (URL uchun)
                              </span>
                            </label>
                            <input
                              id="meta-slug"
                              type="text"
                              className="input input-bordered w-full"
                              placeholder="masalan: pflegefachkraft"
                              value={metaSlug}
                              onChange={(e) => {
                                setMetaSlug(e.target.value);
                                setMetaValidationError("");
                              }}
                              disabled={isSavingMeta}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label" htmlFor="meta-title">
                              <span className="label-text">
                                Title (ko'rinadigan nom)
                              </span>
                            </label>
                            <input
                              id="meta-title"
                              type="text"
                              className="input input-bordered w-full"
                              placeholder="masalan: Pflegefachkraft"
                              value={metaTitle}
                              onChange={(e) => {
                                setMetaTitle(e.target.value);
                                setMetaValidationError("");
                              }}
                              disabled={isSavingMeta}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary w-full"
                          onClick={async () => {
                            if (!majorKey) return;
                            const safeName = String(metaName || "").trim();
                            const safeSlug = String(metaSlug || "").trim();
                            const safeTitle = String(metaTitle || "").trim();

                            if (!safeName || !safeSlug || !safeTitle) {
                              setMetaValidationError(
                                "Barcha maydonlarni to'ldiring."
                              );
                              return;
                            }

                            setIsSavingMeta(true);
                            setMetaValidationError("");
                            try {
                              // Check if name already exists in metadata (excluding current document)
                              const nameQuery = query(
                                collection(db, "meta"),
                                where("name", "==", safeName),
                                limit(10)
                              );
                              const nameSnap = await getDocs(nameQuery);
                              const existingDocs = nameSnap.docs.filter(
                                (d) => d.id !== majorKey
                              );

                              if (existingDocs.length > 0) {
                                setMetaValidationError(
                                  `"${safeName}" nomi allaqachon mavjud. Boshqa nom tanlang.`
                                );
                                setIsSavingMeta(false);
                                return;
                              }

                              // Check if slug already exists (excluding current document)
                              const slugQuery = query(
                                collection(db, "meta"),
                                where("slug", "==", safeSlug),
                                limit(10)
                              );
                              const slugSnap = await getDocs(slugQuery);
                              const existingSlugDocs = slugSnap.docs.filter(
                                (d) => d.id !== majorKey
                              );

                              if (existingSlugDocs.length > 0) {
                                setMetaValidationError(
                                  `"${safeSlug}" slug allaqachon mavjud. Boshqa slug tanlang.`
                                );
                                setIsSavingMeta(false);
                                return;
                              }

                              const now = Date.now();
                              await updateMetaByName(majorKey, {
                                name: safeName,
                                slug: safeSlug,
                                title: safeTitle,
                                updatedAt: now,
                              });
                              toast.success("Yo'nalish ma'lumotlari saqlandi!");
                            } catch (e) {
                              setMetaValidationError(
                                "Saqlashda xatolik yuz berdi."
                              );
                            } finally {
                              setIsSavingMeta(false);
                            }
                          }}
                          disabled={isSavingMeta || isLoading}
                        >
                          {isSavingMeta
                            ? "Saqlanmoqda..."
                            : "Ma'lumotlarni saqlash"}
                        </button>
                      </div>
                    )}

                    <div className="rounded-lg border border-base-300 bg-base-200/20 p-4 space-y-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          Lead linklar (qo'shimcha)
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input input-bordered flex-1"
                            placeholder="Lead nomi (masalan: germaniyLive)"
                            value={newLeadName}
                            onChange={(e) => setNewLeadName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddLead();
                              }
                            }}
                            disabled={
                              !isLinkActive || !leadLinksActive || isSavingLeads
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-primary whitespace-nowrap"
                            onClick={handleAddLead}
                            disabled={
                              !isLinkActive || !leadLinksActive || isSavingLeads
                            }
                          >
                            Lead qo'shish
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-base-300 bg-base-200/30 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            Asosiy linklar
                          </div>
                          <div className="text-xs text-base-content/60 mt-1">
                            Ariza to'ldirish uchun asosiy linklar
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={Boolean(isLinkActive)}
                          onChange={(e) =>
                            onToggleLinkActive?.(e.target.checked)
                          }
                          disabled={Boolean(isTogglingLink)}
                          aria-label="Asosiy linklar"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-base-content/70">
                          Web link
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline w-full justify-between gap-3"
                          onClick={onCopyLink}
                          disabled={
                            !isLinkActive ||
                            !createLink ||
                            Boolean(isTogglingLink) ||
                            Boolean(isLoading)
                          }
                          title={createLink || ""}
                        >
                          <span className="truncate min-w-0">{createLink}</span>
                          <span className="shrink-0">
                            <FaRegCopy />
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-base-content/70 flex items-center gap-2">
                          <FaTelegramPlane className="text-primary" />
                          Telegram link
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline w-full justify-between gap-3"
                          onClick={() => {
                            const majorId =
                              major?.linkId ||
                              major?.uuid ||
                              major?.id ||
                              major?.collectionName ||
                              major;
                            // Replace German special characters for Telegram deep link compatibility
                            const sanitizedMajorId = String(majorId)
                              .replace(/ß/g, "ss")
                              .replace(/ü/g, "ue")
                              .replace(/ö/g, "oe")
                              .replace(/ä/g, "ae");
                            const telegramLink = `https://t.me/consultinguz_admin_bot?start=${sanitizedMajorId}`;
                            navigator.clipboard
                              .writeText(telegramLink)
                              .then(() =>
                                toast.success("Telegram link nusxalandi!")
                              )
                              .catch(() => toast.error("Link nusxalanmadi."));
                          }}
                          disabled={
                            !isLinkActive ||
                            Boolean(isTogglingLink) ||
                            Boolean(isLoading)
                          }
                          title={`https://t.me/consultinguz_admin_bot?start=${
                            major?.linkId ||
                            major?.uuid ||
                            major?.id ||
                            major?.collectionName ||
                            major
                          }`}
                        >
                          <span className="truncate min-w-0">
                            https://t.me/consultinguz_admin_bot?start=
                            {major?.linkId ||
                              major?.uuid ||
                              major?.id ||
                              major?.collectionName ||
                              major}
                          </span>
                          <span className="shrink-0">
                            <FaRegCopy />
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-base-300 bg-base-200/30 p-4 space-y-3">
                      <div className="font-medium">Barcha lead linklar</div>
                      <div className="space-y-3">
                        {leadLinks.length === 0 ? (
                          <div className="text-sm opacity-70">
                            Lead linklar yo‘q.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {leadLinks.map((l) => {
                              const leadName = String(l?.name || "").trim();
                              const leadActive = l?.active !== false;
                              const leadUrl = buildCreateLink(major, leadName);
                              const majorId =
                                major?.linkId ||
                                major?.uuid ||
                                major?.id ||
                                major?.collectionName ||
                                major;
                              // Replace German special characters for Telegram deep link compatibility
                              const sanitizedMajorId = String(majorId)
                                .replace(/ß/g, "ss")
                                .replace(/ü/g, "ue")
                                .replace(/ö/g, "oe")
                                .replace(/ä/g, "ae");
                              const leadIdShort = String(l.id || "").slice(0, 8);
                              const leadTelegramLink = `https://t.me/consultinguz_admin_bot?start=${sanitizedMajorId}__lead__${leadIdShort}`;
                              const canCopy =
                                isLinkActive && leadLinksActive && leadActive;
                              return (
                                <div
                                  key={l.id}
                                  className="rounded-lg border border-base-300 bg-base-100 p-3 space-y-3"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-semibold text-base truncate">
                                        {leadName || "Lead"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <input
                                        type="checkbox"
                                        className="toggle toggle-secondary toggle-sm"
                                        checked={leadActive}
                                        onChange={async (e) =>
                                          handleToggleLeadActive(
                                            l.id,
                                            e.target.checked
                                          )
                                        }
                                        disabled={
                                          isSavingLeads || !leadLinksActive
                                        }
                                        aria-label="Leadni aktiv qilish"
                                        title="Lead ON/OFF"
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-error btn-xs"
                                        onClick={async () => {
                                          setDeleteLead({
                                            id: l.id,
                                            name: leadName || "Lead",
                                          });
                                        }}
                                        disabled={
                                          isSavingLeads || !leadLinksActive
                                        }
                                        aria-label="Leadni o'chirish"
                                        title="Delete"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-base-content/60 flex items-center gap-1">
                                        <FaLink className="h-3 w-3" />
                                        Web link
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm w-full justify-between gap-2 text-xs"
                                        onClick={() => {
                                          if (!canCopy || !leadUrl) {
                                            toast.error(
                                              "Lead link aktiv emas yoki mavjud emas."
                                            );
                                            return;
                                          }
                                          navigator.clipboard
                                            .writeText(leadUrl)
                                            .then(() =>
                                              toast.success(
                                                "Web link nusxalandi!"
                                              )
                                            )
                                            .catch(() =>
                                              toast.error("Link nusxalanmadi.")
                                            );
                                        }}
                                        disabled={
                                          !canCopy || isSavingLeads || !leadUrl
                                        }
                                        title={leadUrl || ""}
                                      >
                                        <span className="truncate text-left">
                                          {leadUrl ? "Nusxalash" : "Link yo'q"}
                                        </span>
                                        <FaRegCopy className="shrink-0" />
                                      </button>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-base-content/60 flex items-center gap-1">
                                        <FaTelegramPlane className="h-3 w-3 text-primary" />
                                        Telegram link
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm w-full justify-between gap-2 text-xs"
                                        onClick={() => {
                                          if (!canCopy) {
                                            toast.error(
                                              "Lead link aktiv emas."
                                            );
                                            return;
                                          }
                                          navigator.clipboard
                                            .writeText(leadTelegramLink)
                                            .then(() =>
                                              toast.success(
                                                "Telegram link nusxalandi!"
                                              )
                                            )
                                            .catch(() =>
                                              toast.error("Link nusxalanmadi.")
                                            );
                                        }}
                                        disabled={!canCopy || isSavingLeads}
                                        title={leadTelegramLink}
                                      >
                                        <span className="truncate text-left">
                                          Nusxalash
                                        </span>
                                        <FaRegCopy className="shrink-0" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : tab === "internal" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label" htmlFor="ms-internal-date">
                          <span className="label-text">Sana</span>
                        </label>
                        <input
                          id="ms-internal-date"
                          type="datetime-local"
                          className="input input-bordered w-full"
                          value={internalDate}
                          onChange={(e) => setInternalDate(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <div className="label flex items-center justify-between">
                          <span className="label-text">Havola</span>
                          <div className="join join-sm">
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                internalLinkType === "zoom"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setInternalLinkType("zoom")}
                              disabled={isSaving}
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                internalLinkType === "telegram"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setInternalLinkType("telegram")}
                              disabled={isSaving}
                            >
                              Telegram
                            </button>
                          </div>
                        </div>
                        {internalLinkType === "telegram" ? (
                          <div className="space-y-2">
                            <select
                              id="ms-internal-telegram-group"
                              className="select select-bordered w-full"
                              value={internalTelegramGroupId}
                              onChange={(e) =>
                                setInternalTelegramGroupId(e.target.value)
                              }
                              disabled={isSaving || tgGroups.length === 0}
                            >
                              <option value="">
                                Telegram group (Ichki) — (tanlanmagan)
                              </option>
                              {tgGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {String(g?.name || g.id)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline w-full"
                              onClick={() =>
                                handleGenerateAndCopyInvite(
                                  internalTelegramGroupId,
                                  "internal"
                                )
                              }
                              disabled={
                                !internalTelegramGroupId ||
                                inviteCopyLoading.internal ||
                                isSaving
                              }
                            >
                              {inviteCopyLoading.internal
                                ? "Invite yaratilmoqda..."
                                : "Invite link yaratish va copy"}
                            </button>
                          </div>
                        ) : (
                          <input
                            id="ms-internal-link"
                            type="url"
                            className="input input-bordered w-full"
                            placeholder="https://zoom.us/j/..."
                            value={internalLink}
                            onChange={(e) => setInternalLink(e.target.value)}
                            disabled={isSaving}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-internal-location-name"
                        >
                          <span className="label-text">
                            Lokatsiya nomi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-internal-location-name"
                          type="text"
                          className="input input-bordered w-full"
                          value={internalLocationName}
                          onChange={(e) =>
                            setInternalLocationName(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-internal-location-url"
                        >
                          <span className="label-text">
                            Lokatsiya havolasi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-internal-location-url"
                          type="url"
                          className="input input-bordered w-full"
                          value={internalLocationUrl}
                          onChange={(e) =>
                            setInternalLocationUrl(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                ) : tab === "leadership" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label" htmlFor="ms-leadership-date">
                          <span className="label-text">Sana</span>
                        </label>
                        <input
                          id="ms-leadership-date"
                          type="datetime-local"
                          className="input input-bordered w-full"
                          value={leadershipDate}
                          onChange={(e) => setLeadershipDate(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <div className="label flex items-center justify-between">
                          <span className="label-text">Havola</span>
                          <div className="join join-sm">
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                leadershipLinkType === "zoom"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setLeadershipLinkType("zoom")}
                              disabled={isSaving}
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                leadershipLinkType === "telegram"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setLeadershipLinkType("telegram")}
                              disabled={isSaving}
                            >
                              Telegram
                            </button>
                          </div>
                        </div>
                        {leadershipLinkType === "telegram" ? (
                          <div className="space-y-2">
                            <select
                              id="ms-leadership-telegram-group"
                              className="select select-bordered w-full"
                              value={leadershipTelegramGroupId}
                              onChange={(e) =>
                                setLeadershipTelegramGroupId(e.target.value)
                              }
                              disabled={isSaving || tgGroups.length === 0}
                            >
                              <option value="">
                                Telegram group (Orif Aka) — (tanlanmagan)
                              </option>
                              {tgGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {String(g?.name || g.id)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline w-full"
                              onClick={() =>
                                handleGenerateAndCopyInvite(
                                  leadershipTelegramGroupId,
                                  "leadership"
                                )
                              }
                              disabled={
                                !leadershipTelegramGroupId ||
                                inviteCopyLoading.leadership ||
                                isSaving
                              }
                            >
                              {inviteCopyLoading.leadership
                                ? "Invite yaratilmoqda..."
                                : "Invite link yaratish va copy"}
                            </button>
                          </div>
                        ) : (
                          <input
                            id="ms-leadership-link"
                            type="url"
                            className="input input-bordered w-full"
                            placeholder="https://zoom.us/j/..."
                            value={leadershipLink}
                            onChange={(e) => setLeadershipLink(e.target.value)}
                            disabled={isSaving}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-leadership-location-name"
                        >
                          <span className="label-text">
                            Lokatsiya nomi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-leadership-location-name"
                          type="text"
                          className="input input-bordered w-full"
                          value={leadershipLocationName}
                          onChange={(e) =>
                            setLeadershipLocationName(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-leadership-location-url"
                        >
                          <span className="label-text">
                            Lokatsiya havolasi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-leadership-location-url"
                          type="url"
                          className="input input-bordered w-full"
                          value={leadershipLocationUrl}
                          onChange={(e) =>
                            setLeadershipLocationUrl(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label className="label" htmlFor="ms-employer-date">
                          <span className="label-text">Sana</span>
                        </label>
                        <input
                          id="ms-employer-date"
                          type="datetime-local"
                          className="input input-bordered w-full"
                          value={employerDate}
                          onChange={(e) => setEmployerDate(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <div className="label flex items-center justify-between">
                          <span className="label-text">Havola</span>
                          <div className="join join-sm">
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                employerLinkType === "zoom"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setEmployerLinkType("zoom")}
                              disabled={isSaving}
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${
                                employerLinkType === "telegram"
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              onClick={() => setEmployerLinkType("telegram")}
                              disabled={isSaving}
                            >
                              Telegram
                            </button>
                          </div>
                        </div>
                        {employerLinkType === "telegram" ? (
                          <div className="space-y-2">
                            <select
                              id="ms-employer-telegram-group"
                              className="select select-bordered w-full"
                              value={employerTelegramGroupId}
                              onChange={(e) =>
                                setEmployerTelegramGroupId(e.target.value)
                              }
                              disabled={isSaving || tgGroups.length === 0}
                            >
                              <option value="">
                                Telegram group (Ish beruvchi) — (tanlanmagan)
                              </option>
                              {tgGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {String(g?.name || g.id)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline w-full"
                              onClick={() =>
                                handleGenerateAndCopyInvite(
                                  employerTelegramGroupId,
                                  "employer"
                                )
                              }
                              disabled={
                                !employerTelegramGroupId ||
                                inviteCopyLoading.employer ||
                                isSaving
                              }
                            >
                              {inviteCopyLoading.employer
                                ? "Invite yaratilmoqda..."
                                : "Invite link yaratish va copy"}
                            </button>
                          </div>
                        ) : (
                          <input
                            id="ms-employer-link"
                            type="url"
                            className="input input-bordered w-full"
                            placeholder="https://zoom.us/j/..."
                            value={employerLink}
                            onChange={(e) => setEmployerLink(e.target.value)}
                            disabled={isSaving}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-employer-location-name"
                        >
                          <span className="label-text">
                            Lokatsiya nomi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-employer-location-name"
                          type="text"
                          className="input input-bordered w-full"
                          value={employerLocationName}
                          onChange={(e) =>
                            setEmployerLocationName(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-control">
                        <label
                          className="label"
                          htmlFor="ms-employer-location-url"
                        >
                          <span className="label-text">
                            Lokatsiya havolasi (ixtiyoriy)
                          </span>
                        </label>
                        <input
                          id="ms-employer-location-url"
                          type="url"
                          className="input input-bordered w-full"
                          value={employerLocationUrl}
                          onChange={(e) =>
                            setEmployerLocationUrl(e.target.value)
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {tab !== "link" ? (
                <div className="border-t border-base-300 px-4 py-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? "Speichern..." : "Speichern"}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {deleteLead?.id ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-base-content/50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteLead(null);
            }}
          />
          <div
            className="relative w-full max-w-md rounded-box bg-base-100 text-base-content shadow-xl border border-base-300"
            role="dialog"
            aria-modal="true"
            aria-label="Leadni o‘chirish"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-base-300 flex items-center justify-between gap-3">
              <div className="font-semibold">Leadni o‘chirish</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteLead(null)}
                disabled={isSavingLeads}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-sm opacity-80">
                Rostdan ham{" "}
                <span className="font-semibold">{deleteLead?.name}</span>{" "}
                leadini o‘chirmoqchimisiz?
              </div>
              <div className="text-xs opacity-60">
                Bu amal qaytarib bo‘lmaydi.
              </div>
            </div>
            <div className="p-4 border-t border-base-300 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => setDeleteLead(null)}
                disabled={isSavingLeads}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={async () => {
                  const id = deleteLead?.id;
                  if (!id) return;
                  await handleRemoveLead(id);
                  setDeleteLead(null);
                }}
                disabled={isSavingLeads}
              >
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

export default function MajorsList() {
  const [majors, setMajors] = useState([]);
  const [serverCounts, setServerCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState({});
  const [togglingMajorId, setTogglingMajorId] = useState("");
  const [settingsMajor, setSettingsMajor] = useState(null); // { major, key }
  const [linkCopyModal, setLinkCopyModal] = useState({
    open: false,
    major: null,
  });
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);
  const isSettingsOpen = Boolean(settingsMajor);

  const getMajorCollectionName = (major) => {
    return String(
      major?.collectionName || major?.slug || major?.name || ""
    ).trim();
  };

  const resolveMajorCount = (major) => {
    const col = getMajorCollectionName(major);
    if (!col) return null;
    const val = serverCounts?.[col];
    if (val === undefined || val === null) return null;
    return Number(val) || 0;
  };

  const handleCopyLink = (major) => {
    if (major?.linkActive === false) {
      toast.error("Create-Link ist derzeit AUS. Bitte zuerst einschalten.");
      return;
    }
    const link = buildCreateLink(major);
    if (!link) {
      toast.error(
        "Link konnte nicht erstellt werden (Berufsfeld nicht erkannt)."
      );
      return;
    }
    setLinkCopyModal({ open: true, major });
  };

  // Delete is currently disabled globally; we keep UI minimal per requirement.

  const resolveMajorKey = (major) => {
    if (!major) return "";
    if (typeof major === "string") return major;
    return String(
      major.id ||
        major.uuid ||
        major.linkId ||
        major.collectionName ||
        major.slug ||
        major.name ||
        ""
    ).trim();
  };

  const handleToggleCreateLink = async (major, nextChecked) => {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, dies zu ändern.");
      return;
    }
    const key = resolveMajorKey(major);
    if (!key) {
      toast.error("Berufsfeld konnte nicht identifiziert werden.");
      return;
    }
    setTogglingMajorId(key);
    // Optimistic UI update
    setMajors((prev) =>
      (prev || []).map((m) => {
        const k = resolveMajorKey(m);
        if (k !== key) return m;
        return { ...(m || {}), linkActive: Boolean(nextChecked) };
      })
    );
    try {
      await updateMetaByName(key, {
        linkActive: Boolean(nextChecked),
        updatedAt: Date.now(),
      });
      toast.success(nextChecked ? "Create-Link: ON" : "Create-Link: OFF");
    } catch (e) {
      // revert (snapshot will also fix, but we revert immediately)
      setMajors((prev) =>
        (prev || []).map((m) => {
          const k = resolveMajorKey(m);
          if (k !== key) return m;
          return { ...(m || {}), linkActive: !Boolean(nextChecked) };
        })
      );
      toast.error("Fehler beim Ändern.");
    } finally {
      setTogglingMajorId("");
    }
  };
  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });

    return () => unsub();
  }, []);

  const settingsMajorKey = settingsMajor?.key || "";
  const currentSettingsMajor = useMemo(() => {
    if (!settingsMajorKey) return settingsMajor?.major || null;
    const found = (majors || []).find(
      (m) => resolveMajorKey(m) === settingsMajorKey
    );
    return found || settingsMajor?.major || null;
  }, [majors, settingsMajorKey, settingsMajor?.major]);

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      if (!Array.isArray(majors) || majors.length === 0) return;
      const cols = majors.map((m) => getMajorCollectionName(m)).filter(Boolean);
      if (cols.length === 0) return;

      // Mark loading for those not yet loaded
      setLoadingCounts((prev) => {
        const next = { ...(prev || {}) };
        cols.forEach((col) => {
          if (serverCounts?.[col] === undefined) next[col] = true;
        });
        return next;
      });

      try {
        const entries = await Promise.all(
          cols.map(async (col) => {
            // Avoid refetching if we already have it
            if (serverCounts?.[col] !== undefined)
              return [col, serverCounts[col]];
            try {
              const snap = await getCountFromServer(collection(db, col));
              return [col, snap.data().count || 0];
            } catch (e) {
              return [col, null];
            }
          })
        );
        if (cancelled) return;
        const next = { ...(serverCounts || {}) };
        entries.forEach((kv) => {
          if (!kv) return;
          const [col, cnt] = kv;
          if (cnt === null) return;
          next[col] = Number(cnt) || 0;
        });
        setServerCounts(next);
        setLoadingCounts((prev) => {
          const out = { ...(prev || {}) };
          cols.forEach((c) => {
            delete out[c];
          });
          return out;
        });
      } catch (e) {}
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majors]);

  return (
    <div>
      <LinkCopyModal
        open={linkCopyModal.open}
        onClose={() => setLinkCopyModal({ open: false, major: null })}
        regularLink={
          linkCopyModal.major ? buildCreateLink(linkCopyModal.major) : ""
        }
        majorCode={
          linkCopyModal.major
            ? linkCopyModal.major?.linkId ||
              linkCopyModal.major?.uuid ||
              linkCopyModal.major?.id ||
              linkCopyModal.major?.collectionName ||
              linkCopyModal.major
            : ""
        }
      />
      {!isLimitedAdmin ? (
        <MajorSettingsModal
          open={isSettingsOpen}
          major={currentSettingsMajor}
          majorKey={settingsMajorKey}
          isTogglingLink={Boolean(
            settingsMajorKey && togglingMajorId === settingsMajorKey
          )}
          onClose={() => setSettingsMajor(null)}
          onCopyLink={() => handleCopyLink(currentSettingsMajor)}
          onToggleLinkActive={(checked) =>
            handleToggleCreateLink(currentSettingsMajor, checked)
          }
        />
      ) : null}
      {majors.length === 0 ? (
        <div className="text-center opacity-70 py-8 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          <p className="mt-1">
            Klicken Sie auf „Neues Berufsfeld“, um zu beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {majors.map((major) => {
            const title =
              major?.title ||
              major?.collectionName ||
              major?.slug ||
              major?.name ||
              String(major);
            const linkId =
              major?.linkId ||
              major?.uuid ||
              major?.id ||
              major?.collectionName ||
              major;
            const majorKey = resolveMajorKey(major);
            const collectionName =
              major?.collectionName ||
              major?.slug ||
              major?.name ||
              major?.id ||
              major;
            const count = resolveMajorCount(major);
            const colNameForCount = getMajorCollectionName(major);
            const isCountLoading = Boolean(
              colNameForCount && loadingCounts?.[colNameForCount]
            );
            return (
              <li
                key={linkId}
                className="flex w-full items-center gap-2 rounded-lg border border-base-200 p-2 hover:bg-base-200/50 transition-colors"
              >
                <div className="indicator grow min-w-0">
                  <span
                    className="indicator-item indicator-top indicator-end badge badge-sm badge-primary pointer-events-none select-none -translate-x-[20%]"
                    aria-label={
                      isCountLoading
                        ? "Kandidaten werden geladen..."
                        : `Kandidaten: ${count ?? 0}`
                    }
                  >
                    {isCountLoading ? "…" : count ?? 0}
                  </span>
                  <Link
                    //  to={`/create?major=${major}`}
                    to={`collectionCv/${linkId}`}
                    className="btn btn-sm btn-outline-info justify-start overflow-hidden min-w-0 w-full pr-12"
                    title={title}
                  >
                    <span className="font-medium truncate">{title}</span>
                  </Link>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleCopyLink(major)}
                  aria-label="Asosiy linkni nusxalash"
                  title="Asosiy linkni copy qilish"
                >
                  <FaRegCopy />
                </button>
                {!isLimitedAdmin ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setSettingsMajor({ major, key: majorKey })}
                    aria-label={`Einstellungen für „${title}“ öffnen`}
                    title="Einstellungen"
                  >
                    <FaCog />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
