import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  return (
    <main className="flex">
      <Sidebar />
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  );
}

export default MainLayout;
