import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserRole } from "../hooks/useUserRole";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase/config";

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

  const [employerDate, setEmployerDate] = useState("");
  const [employerLink, setEmployerLink] = useState("");
  const [employerLinkType, setEmployerLinkType] = useState("zoom");
  const [employerLocationName, setEmployerLocationName] = useState("");
  const [employerLocationUrl, setEmployerLocationUrl] = useState("");

  const [leadLinksActive, setLeadLinksActive] = useState(true);
  const [leadLinks, setLeadLinks] = useState([]);
  const [newLeadName, setNewLeadName] = useState("");
  const [deleteLead, setDeleteLead] = useState(null); // { id, name }

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

        setLeadLinksActive(data?.leadLinksActive !== false);
        const rows = Array.isArray(data?.leadLinks) ? data.leadLinks : [];
        const normalized = rows
          .map((r, idx) => normalizeLeadLinkRow(r, idx))
          .filter(Boolean);
        setLeadLinks(normalized);
        setNewLeadName("");
        setDeleteLead(null);
      } catch (e) {
        if (!cancelled) {
          toast.error("Meta-Daten konnten nicht geladen werden.");
          // eslint-disable-next-line no-console
          console.error("MajorSettingsModal load meta error:", e);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, majorKey]);

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
      toast.success("Lead linklar saqlandi.");
    } catch (e) {
      toast.error("Lead linklarni saqlashda xatolik.");
      // eslint-disable-next-line no-console
      console.error("persistLeadSettings error:", e);
    } finally {
      setIsSavingLeads(false);
    }
  };

  const handleAddLead = async () => {
    const name = String(newLeadName || "").trim();
    if (!name) {
      toast.error("Lead nomini kiriting.");
      return;
    }
    const exists = (leadLinks || []).some(
      (l) =>
        String(l?.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      toast.error("Bunday lead allaqachon bor.");
      return;
    }
    const next = [
      ...(Array.isArray(leadLinks) ? leadLinks : []),
      { id: generateLocalId(), name, active: true },
    ];
    setLeadLinks(next);
    setNewLeadName("");
    await persistLeadSettings(next, leadLinksActive);
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
          updatedAt: now,
        },
        updatedAt: now,
      });
      toast.success("Zusätzliche Informationen gespeichert!");
    } catch (e) {
      toast.error("Speichern fehlgeschlagen.");
      // eslint-disable-next-line no-console
      console.error("MajorSettingsModal save error:", e);
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
                    <div className="rounded-lg border border-base-300 bg-base-200/20 p-4 space-y-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          Lead linklar (qo‘shimcha)
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          placeholder="Lead nomi (masalan: germaniyLive)"
                          value={newLeadName}
                          onChange={(e) => setNewLeadName(e.target.value)}
                          disabled={
                            !isLinkActive || !leadLinksActive || isSavingLeads
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleAddLead}
                          disabled={
                            !isLinkActive || !leadLinksActive || isSavingLeads
                          }
                        >
                          Lead qo‘shish
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-base-300 bg-base-200/30 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            Asosiy link
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
                          aria-label="Asosiy link"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn primary-content w-full justify-between gap-3"
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
                              const canCopy =
                                isLinkActive &&
                                leadLinksActive &&
                                leadActive &&
                                Boolean(leadUrl);
                              return (
                                <div
                                  key={l.id}
                                  className="flex items-center gap-2"
                                >
                                  <button
                                    type="button"
                                    className="btn btn-outline grow justify-between gap-2"
                                    onClick={() => {
                                      if (!canCopy) {
                                        toast.error(
                                          "Lead link hozir aktiv emas (yoki umumiy OFF)."
                                        );
                                        return;
                                      }
                                      navigator.clipboard
                                        .writeText(leadUrl)
                                        .then(() =>
                                          toast.success("Lead link nusxalandi!")
                                        )
                                        .catch(() =>
                                          toast.error(
                                            "Lead linkni copy qilib bo‘lmadi."
                                          )
                                        );
                                    }}
                                    disabled={!canCopy || isSavingLeads}
                                    title={leadUrl || ""}
                                  >
                                    <span className="truncate text-left w-0 flex-1">
                                      {leadName || "Lead"}
                                    </span>
                                    <FaRegCopy className="shrink-0" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-error btn-sm"
                                    onClick={async () => {
                                      setDeleteLead({
                                        id: l.id,
                                        name: leadName || "Lead",
                                      });
                                    }}
                                    disabled={isSavingLeads || !leadLinksActive}
                                    aria-label="Leadni o‘chirish"
                                    title="Delete"
                                  >
                                    <FaTrash className="text-xl" />
                                  </button>
                                  <input
                                    type="checkbox"
                                    className="toggle toggle-secondary"
                                    checked={leadActive}
                                    onChange={async (e) =>
                                      handleToggleLeadActive(
                                        l.id,
                                        e.target.checked
                                      )
                                    }
                                    disabled={isSavingLeads || !leadLinksActive}
                                    aria-label="Leadni aktiv qilish"
                                    title="Lead ON/OFF"
                                  />
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
                        <input
                          id="ms-internal-link"
                          type="url"
                          className="input input-bordered w-full"
                          placeholder={
                            internalLinkType === "telegram"
                              ? "https://t.me/..."
                              : "https://zoom.us/j/..."
                          }
                          value={internalLink}
                          onChange={(e) => setInternalLink(e.target.value)}
                          disabled={isSaving}
                        />
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
                        <input
                          id="ms-employer-link"
                          type="url"
                          className="input input-bordered w-full"
                          placeholder={
                            employerLinkType === "telegram"
                              ? "https://t.me/..."
                              : "https://zoom.us/j/..."
                          }
                          value={employerLink}
                          onChange={(e) => setEmployerLink(e.target.value)}
                          disabled={isSaving}
                        />
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
      toast.error("Create-Link hozir OFF. Avval ON qiling.");
      return;
    }
    const link = buildCreateLink(major);
    if (!link) {
      toast.error("Link yaratib bo‘lmadi (major aniqlanmadi).");
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Link in die Zwischenablage kopiert!");
      })
      .catch(() => {
        toast.error("Link konnte nicht kopiert werden");
      });
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
      toast.error("O‘zgartirishda xatolik bo‘ldi.");
      // eslint-disable-next-line no-console
      console.error("toggle linkActive failed:", e);
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
              console.error("getCountFromServer failed for", col, e);
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
      } catch (e) {
        console.error("fallback count error", e);
      }
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majors]);

  return (
    <div>
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
