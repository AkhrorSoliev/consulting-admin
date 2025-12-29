import { FaHome, FaUserCircle } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { MdSettings } from "react-icons/md";
import { Link } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";

function MobileNavbar() {
  const { role, loadingRole } = useUserRole();
  return (
    <div className="flex items-center gap-2 bg-base-100 fixed bottom-0 z-50 w-full justify-between md:hidden">
      <Link
        to="/"
        className="btn btn-ghost gap-2 sm:inline-flex"
        aria-label="Zur Startseite"
        data-sidebar-toggle
      >
        <FaHome className="text-xl" />
      </Link>
      <Link
        to="/profile"
        className="btn btn-ghost gap-2 sm:inline-flex"
        aria-label="Profil"
        data-sidebar-toggle
      >
        <FaUserCircle className="text-xl" />
      </Link>
      {!loadingRole && (role === "super_admin" || role === "admin") && (
        <Link
          to="/settings"
          className="btn btn-ghost gap-2 sm:inline-flex"
          aria-label="Einstellungen"
          data-sidebar-toggle
        >
          <MdSettings className="text-xl" />
        </Link>
      )}
      {!loadingRole && (role === "super_admin" || role === "admin") && (
        <Link
          to="/candidates"
          className="btn btn-ghost gap-2 sm:inline-flex"
          aria-label="Kandidaten"
          data-sidebar-toggle
        >
          <FiUsers className="text-xl" />
        </Link>
      )}
    </div>
  );
}

export default MobileNavbar;
