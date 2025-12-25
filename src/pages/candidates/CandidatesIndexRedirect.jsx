import { Navigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";

export default function CandidatesIndexRedirect() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });

  if (loadingRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  const isPrivileged = role === "super_admin" || role === "admin";
  if (!isPrivileged) return <Navigate to="/" replace />;

  return <Navigate to="archived" replace />;
}


