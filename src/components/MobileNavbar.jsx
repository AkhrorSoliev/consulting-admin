import { FaHome, FaUserCircle } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { IoStatsChart } from "react-icons/io5";
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
      >
        <FaHome className="text-xl" />
      </Link>
      <Link
        to="/statistics"
        className="btn btn-ghost gap-2 sm:inline-flex"
        aria-label="Statistiken"
      >
        <IoStatsChart className="text-xl" />
      </Link>
      <Link
        to="/profile"
        className="btn btn-ghost gap-2 sm:inline-flex"
        aria-label="Profil"
      >
        <FaUserCircle className="text-xl" />
      </Link>
      {!loadingRole && (role === "super_admin" || role === "admin") && (
        <Link
          to="/settings"
          className="btn btn-ghost gap-2 sm:inline-flex"
          aria-label="Einstellungen"
        >
          <MdSettings className="text-xl" />
        </Link>
      )}
      {!loadingRole && (role === "super_admin" || role === "admin") && (
        <Link
          to="/candidates"
          className="btn btn-ghost gap-2 sm:inline-flex"
          aria-label="Kandidaten"
        >
          <FiUsers className="text-xl" />
        </Link>
      )}
    </div>
  );
}

export default MobileNavbar;
