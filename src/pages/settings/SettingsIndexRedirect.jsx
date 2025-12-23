import { Navigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";

export default function SettingsIndexRedirect() {
  const { role, loadingRole } = useUserRole();

  if (loadingRole) {
    return (
      <div className="w-full">
        <div className="rounded-box border border-base-300 bg-base-100 p-6 shadow">
          <p className="text-sm text-base-content/60">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (role === "super_admin") {
    return <Navigate to="/settings/admins" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/settings/template-emails" replace />;
  }

  return <Navigate to="/" replace />;
}


