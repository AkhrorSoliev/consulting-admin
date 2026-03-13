import { useEffect, useState } from "react";
import useUserRole from "../../../hooks/useUserRole";
import {
  FILLABLE_PDF_TEMPLATE_IDS,
  FILLABLE_PDF_TEMPLATE_LABELS,
  subscribeToFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../../../utils/fillablePdfDefaults";
import TemplateDefaultsCard from "./TemplateDefaultsCard";

export default function FillablePdfDefaultsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const canAccess = isSuperAdmin || isAdmin;

  const [defaultsMap, setDefaultsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return undefined;
    }
    const unsub = subscribeToFillablePdfDefaults((map) => {
      setDefaultsMap(map || {});
      setLoading(false);
    });
    return () => unsub?.();
  }, [canAccess]);

  if (loadingRole || loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="alert alert-warning">
        <span>
          Diese Funktion ist nur für Administratoren verfügbar.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Fillable PDF Standardwerte</h2>
        <p className="text-sm text-base-content/60">
          Hier können Sie Standardwerte für die ausfüllbaren PDF-Formulare festlegen.
          Diese Werte werden automatisch in die Formulare eingetragen, wenn ein
          Kandidat das Dokument öffnet.
        </p>
      </div>

      <div className="space-y-3">
        {FILLABLE_PDF_TEMPLATE_IDS.map((templateId) => (
          <TemplateDefaultsCard
            key={templateId}
            templateId={templateId}
            label={FILLABLE_PDF_TEMPLATE_LABELS[templateId]}
            savedData={defaultsMap[templateId]}
            onSave={saveFillablePdfDefaults}
            onClear={clearFillablePdfDefaults}
          />
        ))}
      </div>
    </div>
  );
}
