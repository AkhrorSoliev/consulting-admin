import { Link } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";
import { DOCUMENT_TEMPLATES } from "../../constants/documentTemplates";

export default function DocumentsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const canAccess = isSuperAdmin || isAdmin;

  if (loadingRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Dokumente</h2>
        <p className="text-sm text-base-content/60">
          Hier finden Sie gespeicherte Dokument‑Templates. Klicken Sie ein
          Template an, um es zu öffnen.
        </p>
        {!canAccess ? (
          <div className="alert alert-info mt-3">
            <span className="text-sm">
              Hinweis: Einige administrative Dokument‑Funktionen sind nur für{" "}
              <span className="font-mono">role=admin</span> oder{" "}
              <span className="font-mono">role=super_admin</span> verfügbar.
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {DOCUMENT_TEMPLATES.filter((doc) => !doc.disabled).map((doc) => (
          <div
            key={doc.id}
            className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{doc.title}</h3>
                  <span className="badge badge-outline">Template</span>
                </div>
                <p className="mt-1 text-sm text-base-content/70">
                  {doc.description}
                </p>
              </div>

              <Link to={doc.to} className="btn btn-sm btn-primary shrink-0">
                Öffnen
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
