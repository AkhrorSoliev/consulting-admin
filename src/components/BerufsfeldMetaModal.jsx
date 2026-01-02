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

export default function BerufsfeldMetaModal({ major, open, onClose }) {
  const dialogRef = useRef(null);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [internalDate, setInternalDate] = useState("");
  const [internalLink, setInternalLink] = useState("");
  const [employerDate, setEmployerDate] = useState("");
  const [employerLink, setEmployerLink] = useState("");

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else if (el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open || !major) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getMetaByName(major);
        if (cancelled) return;
        setInternalDate(toInputDateString(data?.interviewInternal?.date));
        setInternalLink(String(data?.interviewInternal?.link || ""));
        setEmployerDate(toInputDateString(data?.interviewEmployer?.date));
        setEmployerLink(String(data?.interviewEmployer?.link || ""));
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
  }, [open, major]);

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = async () => {
    if (!major) return;
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, diese Daten zu bearbeiten.");
      return;
    }
    setIsSaving(true);
    try {
      const now = Date.now();
      await updateMetaByName(major, {
        interviewInternal: {
          date: internalDate || "",
          link: internalLink || "",
          updatedAt: now,
        },
        interviewEmployer: {
          date: employerDate || "",
          link: employerLink || "",
          updatedAt: now,
        },
        updatedAt: now,
      });
      toast.success("Zusätzliche Informationen gespeichert!");
      handleClose();
    } catch (e) {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={handleClose}
    >
      <div className="modal-box max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-lg">
            Zusätzliche Infos: <span className="text-primary">{major}</span>
          </h3>
          <button type="button" className="btn btn-sm" onClick={handleClose}>
            Schließen
          </button>
        </div>

        {isLoading ? (
          <div className="py-6 text-sm opacity-70">Wird geladen...</div>
        ) : (
          <div className="mt-4 space-y-3">
            <CollapsibleSection title="Ichki suxbat ma'lumotlari" defaultOpen>
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
                  <label className="label" htmlFor="internal-link">
                    <span className="label-text">Link</span>
                  </label>
                  <input
                    id="internal-link"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://..."
                    value={internalLink}
                    onChange={(e) => setInternalLink(e.target.value)}
                    disabled={isLimitedAdmin}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Ish beruvchi bilan suxbat ma'lumotlari">
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
                  <label className="label" htmlFor="employer-link">
                    <span className="label-text">Link</span>
                  </label>
                  <input
                    id="employer-link"
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://..."
                    value={employerLink}
                    onChange={(e) => setEmployerLink(e.target.value)}
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
