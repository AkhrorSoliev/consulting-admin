import { Navigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";

export default function SettingsIndexRedirect() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });

  if (loadingRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  // Super admin lands on Admins; everyone else lands on template emails.
  if (role === "super_admin") {
    return <Navigate to="admins" replace />;
  }

  return <Navigate to="template-emails" replace />;
}