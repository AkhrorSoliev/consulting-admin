import useUserRole from "../hooks/useUserRole";
import SuperAdminUserManagement from "../components/SuperAdminUserManagement";

function Settings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });

  if (loadingRole) {
    return (
      <p className="text-sm text-base-content/60">Wird geladen...</p>
    );
  }

  if (role !== "super_admin") {
    return (
      <>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-error">Kein Zugriff. (Super Admin erforderlich)</p>
        <p className="text-sm text-base-content/60">
          Sizning akkauntingizda <span className="font-mono">role=super_admin</span> custom claim yo‘q.
          Logout/Login qiling yoki claim to‘g‘ri berilganini tekshiring.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="space-y-1 mb-4">
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-base-content/60">Nur für Super Admin.</p>
      </div>
      <SuperAdminUserManagement />
    </>
  );
}

export default Settings;


