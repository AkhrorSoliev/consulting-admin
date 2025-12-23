import { Navigate } from "react-router-dom";
import SuperAdminUserManagement from "../../components/SuperAdminUserManagement";
import useUserRole from "../../hooks/useUserRole";

export default function AdminsSettings() {
  const { role, loadingRole } = useUserRole();

  if (loadingRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  if (role !== "super_admin") {
    return <Navigate to="/settings/template-emails" replace />;
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Adminlar</h2>
        <p className="text-sm text-base-content/60">
          Bu yerda adminlar rolini va akkauntlarini boshqarasiz.
        </p>
      </div>
      <SuperAdminUserManagement />
    </div>
  );
}


