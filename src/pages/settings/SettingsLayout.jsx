import { NavLink, Outlet } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";
import { MdSettings, MdEmail } from "react-icons/md";
import { FiUsers } from "react-icons/fi";

function menuItemClass({ isActive }) {
  const base =
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
  const inactive =
    "text-base-content/80 hover:bg-base-300/60 hover:text-base-content";
  const active =
    "bg-primary text-primary-content shadow-sm ring-1 ring-primary/30";
  return `${base} ${isActive ? active : inactive}`;
}

export default function SettingsLayout() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const showAdmins = !loadingRole && role === "super_admin";

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <aside className="md:sticky md:top-0 self-start rounded-box border border-base-300 bg-base-100 shadow">
          <div className="p-4 border-b border-base-200">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                <MdSettings className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">Settings</div>
                <div className="text-xs text-base-content/60">
                  Admin & Template Einstellungen
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <ul className="space-y-1">
            {showAdmins && (
              <li>
                <NavLink to="admins" className={menuItemClass} end>
                  <FiUsers className="h-[18px] w-[18px] opacity-90" aria-hidden="true" />
                  <span className="flex-1">Admins</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="template-emails" className={menuItemClass} end>
                <MdEmail className="h-[18px] w-[18px] opacity-90" aria-hidden="true" />
                <span className="flex-1">Template E-Mails</span>
              </NavLink>
            </li>
            </ul>
          </div>
        </aside>

        <section className="min-w-0 rounded-box border border-base-300 bg-base-100 p-6 shadow">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
