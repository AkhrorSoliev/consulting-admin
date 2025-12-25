import { Navigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";

export default function SettingsIndexRedirect() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Wird geladen...</div>;
  }

  const target = role === "super_admin" ? "admins" : "template-emails";
  return <Navigate to={target} replace />;
}
