import { NavLink, Outlet } from "react-router-dom";
import { MdSettings, MdPeopleAlt, MdEmail } from "react-icons/md";
import useUserRole from "../../hooks/useUserRole";

function SettingsNavLink({ to, icon: Icon, title }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg px-3 py-2 transition",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-base-200/70",
        ].join(" ")
      }
      end
    >
      <Icon className="text-lg opacity-80" />
      <div className="min-w-0 font-medium">{title}</div>
    </NavLink>
  );
}

export default function SettingsLayout() {
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

  const canAccessSettings = role === "super_admin" || role === "admin";

  if (!canAccessSettings) {
    return (
      <div className="w-full">
        <div className="rounded-box border border-base-300 bg-base-100 p-6 shadow space-y-2">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MdSettings className="text-2xl" /> Einstellungen
          </h1>
          <p className="text-sm text-error">
            Kein Zugriff. (Admin yoki Super Admin talab qilinadi)
          </p>
          <p className="text-sm text-base-content/60">
            Sizning akkauntingizda{" "}
            <span className="font-mono">role=admin</span> yoki{" "}
            <span className="font-mono">role=super_admin</span> custom claim yo‘q.
            Logout/Login qiling yoki claim to‘g‘ri berilganini tekshiring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 items-start">
        <aside className="border border-base-300 bg-base-100 rounded-lg p-2">
          <div className="flex flex-col gap-1">
            {role === "super_admin" && (
              <SettingsNavLink
                to="/settings/admins"
                icon={MdPeopleAlt}
                title="Adminlar"
              />
            )}
            <SettingsNavLink
              to="/settings/template-emails"
              icon={MdEmail}
              title="Template Emaillar"
            />
          </div>
        </aside>

        <section className="border border-base-300 bg-base-100 rounded-lg p-4">
          <Outlet />
        </section>
      </div>
    </div>
  );
}


