import { Link } from "react-router-dom";
import SuperAdminUserManagement from "../../components/SuperAdminUserManagement";
import useUserRole from "../../hooks/useUserRole";

export default function AdminsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });

  if (loadingRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  if (role !== "super_admin") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-base-300 bg-base-100 p-4">
          <h2 className="text-lg font-semibold">Kein Zugriff</h2>
          <p className="text-sm text-error">
            Für den Zugriff auf den Admin-Bereich wird{" "}
            <span className="font-mono">role=super_admin</span> benötigt.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-2 text-xs text-base-content/60">
              Debug: current role claim ={" "}
              <span className="font-mono">{String(role)}</span>
            </p>
          )}
          <div className="mt-3">
            <Link
              to="/settings/template-emails"
              className="btn btn-sm btn-primary"
            >
              Zu den E-Mail-Vorlagen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Admins</h2>
        <p className="text-sm text-base-content/60">
          Hier verwalten Sie Admin-Rollen und Benutzerkonten.
        </p>
      </div>
      <SuperAdminUserManagement />
    </div>
  );
}
