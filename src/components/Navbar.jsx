import { MdMenu, MdMenuOpen } from "react-icons/md";

// Hybrid header: utility/brand rail; sidebar stays primary nav to keep hierarchy.
function Navbar({ title = "Consulting Admin", isSidebarOpen, onToggleSidebar, children }) {
  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={isSidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-square"
          >
            {isSidebarOpen ? <MdMenuOpen className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-base-content/60">Dashboard</p>
            <p className="text-lg font-semibold leading-tight">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export default Navbar;

