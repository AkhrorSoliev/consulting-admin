import useUserRole from "../hooks/useUserRole";
import SuperAdminUserManagement from "../components/SuperAdminUserManagement";

function Settings() {
  const { role, loadingRole } = useUserRole();

  if (loadingRole) {
    return (
      <div className="max-w-6xl w-full mx-auto">
        <div className="rounded-box border border-base-300 bg-base-100 p-6 shadow">
          <p className="text-sm text-base-content/60">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (role !== "super_admin") {
    return (
      <div className="max-w-6xl w-full mx-auto">
        <div className="rounded-box border border-base-300 bg-base-100 p-6 shadow space-y-2">
          <h1 className="text-2xl font-semibold">Einstellungen</h1>
          <p className="text-sm text-error">
            Kein Zugriff. (Super Admin erforderlich)
          </p>
          <p className="text-sm text-base-content/60">
            Sizning akkauntingizda <span className="font-mono">role=super_admin</span> custom claim yo‘q.
            Logout/Login qiling yoki claim to‘g‘ri berilganini tekshiring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto">
      <div className="rounded-box border border-base-300 bg-base-100 p-6 shadow space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Einstellungen</h1>
          <p className="text-sm text-base-content/60">
            Nur für Super Admin.
          </p>
        </div>
        <SuperAdminUserManagement />
      </div>
    </div>
  );
}

export default Settings;


