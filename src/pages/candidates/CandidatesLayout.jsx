import { NavLink, Outlet } from "react-router-dom";
import { FiUsers, FiArchive, FiTrash2 } from "react-icons/fi";
import useUserRole from "../../hooks/useUserRole";

function menuItemClass({ isActive }) {
  const base =
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
  const inactive =
    "text-base-content/80 hover:bg-base-300/60 hover:text-base-content";
  const active =
    "bg-primary text-primary-content shadow-sm ring-1 ring-primary/30";
  return `${base} ${isActive ? active : inactive}`;
}

export default function CandidatesLayout() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <aside className="md:sticky md:top-0 self-start rounded-box border border-base-300 bg-base-100 shadow">
          <div className="p-4 border-b border-base-200">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                <FiUsers className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">Kandidaten</div>
                <div className="text-xs text-base-content/60">
                  Firestore (archived_users / deleted_users)
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {!loadingRole && !isPrivileged ? (
              <div className="p-3 text-sm text-base-content/70">
                Keine Berechtigung.
              </div>
            ) : (
              <ul className="space-y-1">
                <li>
                  <div
                    className={[
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      "text-base-content/40 cursor-not-allowed",
                      "opacity-70",
                    ].join(" ")}
                    title="Disabled"
                    aria-disabled="true"
                  >
                    <FiUsers
                      className="h-[18px] w-[18px] opacity-60"
                      aria-hidden="true"
                    />
                    <span className="flex-1">Alle Benutzer</span>
                  </div>
                </li>
                <li>
                  <NavLink to="archived" className={menuItemClass} end>
                    <FiArchive
                      className="h-[18px] w-[18px] opacity-90"
                      aria-hidden="true"
                    />
                    <span className="flex-1">Archivierte Benutzer</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="deleted" className={menuItemClass} end>
                    <FiTrash2
                      className="h-[18px] w-[18px] opacity-90"
                      aria-hidden="true"
                    />
                    <span className="flex-1">Gelöschte Benutzer</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </div>
        </aside>

        <section className="min-w-0 rounded-box border border-base-300 bg-base-100/95 p-6 shadow">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
