import { useEffect, useMemo, useRef } from "react";
import { useUserRole } from "../hooks/useUserRole";
import useBerufsfeldMeta from "./berufsfeldMeta/useBerufsfeldMeta";
import InterviewFormFields from "./berufsfeldMeta/InterviewFormFields";

export default function BerufsfeldMetaModal({ major, open, onClose }) {
  const dialogRef = useRef(null);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);

  const meta = useBerufsfeldMeta(major, open, onClose, isLimitedAdmin);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else if (el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={meta.handleClose}
    >
      <div className="modal-box max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-lg">
            Zusätzliche Infos: <span className="text-primary">{major}</span>
          </h3>
          <button type="button" className="btn btn-sm" onClick={meta.handleClose}>
            Schließen
          </button>
        </div>

        {meta.isLoading ? (
          <div className="py-6 text-sm opacity-70">Wird geladen...</div>
        ) : (
          <InterviewFormFields
            isLimitedAdmin={isLimitedAdmin}
            internalDate={meta.internalDate}
            setInternalDate={meta.setInternalDate}
            internalLink={meta.internalLink}
            setInternalLink={meta.setInternalLink}
            employerDate={meta.employerDate}
            setEmployerDate={meta.setEmployerDate}
            employerLink={meta.employerLink}
            setEmployerLink={meta.setEmployerLink}
          />
        )}

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={meta.handleSave}
            disabled={isLimitedAdmin || meta.isSaving || meta.isLoading}
          >
            {meta.isSaving ? "Speichern..." : "Speichern"}
          </button>
          <button type="button" className="btn" onClick={meta.handleClose}>
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
