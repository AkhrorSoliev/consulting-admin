import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CollapsibleSection from "./CollapsibleSection";
import { getMetaByName, updateMetaByName } from "../utils";
import { useUserRole } from "../hooks/useUserRole";

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
  if (rawLink.includes("t.me/") || rawLink.includes("telegram")) return "telegram";
  return "zoom";
}

export default function BerufsfeldMetaModal({ major, open, onClose }) {
  const dialogRef = useRef(null);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const majorKey = useMemo(() => {
    if (!major) return "";
    if (typeof major === "string") return major;
    return (
      major.collectionName ||
      major.slug ||
      major.name ||
      major.id ||
      major.uuid ||
      ""
    );
  }, [major]);

  const majorTitle = useMemo(() => {
    if (!major) return "";
    if (typeof major === "string") return major;
    return (
      major.title ||
      major.displayName ||
      major.collectionName ||
      major.slug ||
      major.name ||
      major.id ||
      major.uuid ||
      ""
    );
  }, [major]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else if (el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open || !majorKey) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getMetaByName(majorKey);
        if (cancelled) return;
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

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = async () => {
    if (!majorKey) return;
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, diese Daten zu bearbeiten.");
      return;
    }
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
          locationName: normalizeLocation(internalLocationName, internalLocationUrl),
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
      handleClose();
    } catch (e) {
      toast.error("Speichern fehlgeschlagen.");
      // eslint-disable-next-line no-console
      console.error("BerufsfeldMetaModal save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Limited admins should not access Berufsfeld "Zusätzliche Infos" UI at all.
  // IMPORTANT: keep this check AFTER all hooks to avoid "Rendered fewer hooks than expected".
  if (isLimitedAdmin) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={handleClose}
    >
      <div className="modal-box max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-lg">
            Zusätzliche Infos:{" "}
            <span className="text-primary">{majorTitle || majorKey}</span>
          </h3>
          <button type="button" className="btn btn-sm" onClick={handleClose}>
            Schließen
          </button>
        </div>

        {isLoading ? (
          <div className="py-6 text-sm opacity-70">Wird geladen...</div>
        ) : (
          <div className="mt-4 space-y-3">
            <CollapsibleSection
              title="Ichki suxbat ma'lumotlari"
              defaultOpen
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="internal-date">
                    <span className="label-text">Sana</span>
                  </label>
                  <input
                    id="internal-date"
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={internalDate}
                    onChange={(e) => setInternalDate(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
                <div className="form-control">
                  <div className="label flex items-center justify-between">
                    <span className="label-text">Havola</span>
                    <div className="join join-sm">
                      <button
                        type="button"
                        className={`btn btn-xs join-item ${
                          internalLinkType === "zoom" ? "btn-primary" : "btn-ghost"
                        }`}
                        onClick={() => setInternalLinkType("zoom")}
                        disabled={isLimitedAdmin}
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
                        disabled={isLimitedAdmin}
                      >
                        Telegram
                      </button>
                    </div>
                  </div>
                  <input
                    id="internal-link"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder={
                      internalLinkType === "telegram"
                        ? "https://t.me/..."
                        : "https://zoom.us/j/..."
                    }
                    value={internalLink}
                    onChange={(e) => setInternalLink(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                  <p className="text-xs opacity-60 mt-1">
                    Emailda “{internalLinkType === "telegram" ? "Telegram link" : "Zoom link"}”
                    deb ko&apos;rsatiladi.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="internal-location-name">
                    <span className="label-text">Lokatsiya nomi (ixtiyoriy)</span>
                  </label>
                  <input
                    id="internal-location-name"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Masalan: Berlin ofisi"
                    value={internalLocationName}
                    onChange={(e) => setInternalLocationName(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="internal-location-url">
                    <span className="label-text">Lokatsiya havolasi (ixtiyoriy)</span>
                  </label>
                  <input
                    id="internal-location-url"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://maps.app.goo.gl/..."
                    value={internalLocationUrl}
                    onChange={(e) => setInternalLocationUrl(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Ish beruvchi bilan suxbat ma'lumotlari"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="employer-date">
                    <span className="label-text">Sana</span>
                  </label>
                  <input
                    id="employer-date"
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={employerDate}
                    onChange={(e) => setEmployerDate(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
                <div className="form-control">
                  <div className="label flex items-center justify-between">
                    <span className="label-text">Havola</span>
                    <div className="join join-sm">
                      <button
                        type="button"
                        className={`btn btn-xs join-item ${
                          employerLinkType === "zoom" ? "btn-primary" : "btn-ghost"
                        }`}
                        onClick={() => setEmployerLinkType("zoom")}
                        disabled={isLimitedAdmin}
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
                        disabled={isLimitedAdmin}
                      >
                        Telegram
                      </button>
                    </div>
                  </div>
                  <input
                    id="employer-link"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder={
                      employerLinkType === "telegram"
                        ? "https://t.me/..."
                        : "https://zoom.us/j/..."
                    }
                    value={employerLink}
                    onChange={(e) => setEmployerLink(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                  <p className="text-xs opacity-60 mt-1">
                    Emailda “{employerLinkType === "telegram" ? "Telegram link" : "Zoom link"}”
                    deb ko&apos;rsatiladi.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="employer-location-name">
                    <span className="label-text">Lokatsiya nomi (ixtiyoriy)</span>
                  </label>
                  <input
                    id="employer-location-name"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Masalan: Berlin ofisi"
                    value={employerLocationName}
                    onChange={(e) => setEmployerLocationName(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="employer-location-url">
                    <span className="label-text">Lokatsiya havolasi (ixtiyoriy)</span>
                  </label>
                  <input
                    id="employer-location-url"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://maps.app.goo.gl/..."
                    value={employerLocationUrl}
                    onChange={(e) => setEmployerLocationUrl(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isLimitedAdmin || isSaving || isLoading}
          >
            {isSaving ? "Speichern..." : "Speichern"}
          </button>
          <button type="button" className="btn" onClick={handleClose}>
            Abbrechen
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="close" />
      </form>
    </dialog>
  );
}


