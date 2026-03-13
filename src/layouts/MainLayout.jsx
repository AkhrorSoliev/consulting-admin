import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ConfirmActionModal from "../components/ConfirmActionModal";
import { FaHome, FaUserCircle } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { IoStatsChart } from "react-icons/io5";
import {
  MdDarkMode,
  MdLightMode,
  MdOutlineLogout,
  MdSettings,
} from "react-icons/md";
import { useLogout } from "../hooks/useLogut";
import { useTheme } from "../hooks/useTheme";
import useUserRole from "../hooks/useUserRole";

function MainLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const { logoutUser, isPending } = useLogout();
  const { theme, toggleTheme } = useTheme();
  const { role, loadingRole } = useUserRole();
  const isDracula = theme === "dracula";
  const sidebarRef = useRef(null);

  const isHome = location.pathname === "/";

  // Close sidebar on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isDrawerOpen) return;
      if (!sidebarRef.current) return;
      if (
        sidebarRef.current.contains(event.target) ||
        event.target.closest("[data-sidebar-toggle]")
      ) {
        return;
      }
      setIsDrawerOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDrawerOpen]);

  return (
    <div className="relative min-h-screen bg-base-200">
      <Navbar
        showSidebarToggle={!isHome}
        isSidebarOpen={isDrawerOpen}
        onToggleSidebar={() => setIsDrawerOpen((prev) => !prev)}
      >
        <Link
          to="/"
          className="btn btn-ghost gap-2"
          aria-label="Zur Startseite"
          data-sidebar-toggle
        >
          <FaHome className="text-xl" />
          <span className="font-medium">Home</span>
        </Link>
        <Link
          to="/statistics"
          className="btn btn-ghost gap-2"
          aria-label="Statistiken"
          data-sidebar-toggle
        >
          <IoStatsChart className="text-xl" />
          <span className="font-medium">Statistiken</span>
        </Link>
        <Link
          to="/profile"
          className="btn btn-ghost gap-2"
          aria-label="Profil"
          data-sidebar-toggle
        >
          <FaUserCircle className="text-xl" />
          <span className="font-medium">Profil</span>
        </Link>
        {!loadingRole && (role === "super_admin" || role === "admin") && (
          <Link
            to="/settings"
            className="btn btn-ghost gap-2"
            aria-label="Einstellungen"
            data-sidebar-toggle
          >
            <MdSettings className="text-xl" />
            <span className="font-medium">Einstellungen</span>
          </Link>
        )}
        {!loadingRole && (role === "super_admin" || role === "admin") && (
          <Link
            to="/candidates"
            className="btn btn-ghost gap-2"
            aria-label="Kandidaten"
            data-sidebar-toggle
          >
            <FiUsers className="text-xl" />
            <span className="font-medium">Kandidaten</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-ghost btn-square"
          aria-label="Theme wechseln"
          data-sidebar-toggle
        >
          {isDracula ? (
            <MdLightMode className="text-xl" />
          ) : (
            <MdDarkMode className="text-xl" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          disabled={isPending}
          className="btn btn-outline btn-secondary gap-2"
          aria-label="Abmelden"
          data-sidebar-toggle
        >
          {isPending ? (
            "Abmelden..."
          ) : (
            <>
              <MdOutlineLogout className="text-xl" />
              <span className="font-medium">Abmelden</span>
            </>
          )}
        </button>
      </Navbar>

      <main
        className={`p-4 md:p-6 min-h-screen ${
          isDracula ? "bg-base-200/30" : ""
        }`}
      >
        <Outlet />
      </main>

      {/* Sidebar overlay + panel — only rendered when NOT on Home */}
      {!isHome && (
        <>
          {isDrawerOpen && (
            <button
              type="button"
              aria-label="Overlay to close sidebar"
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}
          <Sidebar
            ref={sidebarRef}
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
        </>
      )}

      <ConfirmActionModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logoutUser}
        title="Abmelden bestätigen"
        message="Möchten Sie sich wirklich abmelden?"
        confirmLabel="Abmelden"
        confirmVariant="error"
        busy={isPending}
        confirmIcon={<MdOutlineLogout />}
      />
    </div>
  );
}

export default MainLayout;
