import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { LuPanelLeftClose } from "react-icons/lu";

function MainLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const path = String(location.pathname || "");
    const isGenerate = /^\/generate\//.test(path);
    setIsDrawerOpen(!isGenerate);
  }, [location.pathname]);

  return (
    <div className={`drawer ${isDrawerOpen ? "drawer-open" : ""} h-screen`}>
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={(e) => setIsDrawerOpen(e.target.checked)}
      />
      <div
        className={`drawer-content flex flex-col transition-all duration-200 ${
          isDrawerOpen ? "ml-80" : ""
        }`}
      >
        {!isDrawerOpen && (
          <button
            type="button"
            aria-label="Seitenleiste öffnen"
            title="Seitenleiste öffnen"
            onClick={() => setIsDrawerOpen(true)}
            className="btn btn-primary btn-circle fixed bottom-4 left-4 z-50"
          >
            <LuPanelLeftClose className="text-2xl" />
          </button>
        )}
        <div className="grow overflow-y-auto">
          <Outlet />
        </div>
      </div>
      <div className="drawer-side">
        <Sidebar onClose={() => setIsDrawerOpen(false)} />
      </div>
    </div>
  );
}

export default MainLayout;
