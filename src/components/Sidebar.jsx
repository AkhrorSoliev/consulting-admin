import { forwardRef } from "react";
import { IoMdAddCircle } from "react-icons/io";
import MajorModal from "./MajorModal";
import MajorsList from "./MajorsList";
import { useUserRole } from "../hooks/useUserRole";

const Sidebar = forwardRef(function Sidebar({ isOpen = false, onClose }, ref) {
  const { role } = useUserRole();
  const isLimitedAdmin = role === "limited_admin";

  const addMajor = () => {
    document.getElementById("my_modal_5").showModal();
  };

  return (
    <>
      <MajorModal />
      <aside
        ref={ref}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose?.();
          }
        }}
        className={`fixed left-0 top-16 z-40  h-[calc(100vh-4rem)] w-[26rem] max-w-[80vw] transform bg-base-300/95 shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Berufsfelder</h3>
          </div>

          <div>
            {!isLimitedAdmin && (
              <button
                onClick={addMajor}
                className="btn btn-outline btn-primary btn-block mb-4"
              >
                <IoMdAddCircle className="mr-2 text-xl" /> Neues Berufsfeld
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul>
              <MajorsList />
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
