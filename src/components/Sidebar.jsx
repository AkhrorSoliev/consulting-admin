import { useLogout } from "../hooks/useLogut";
import { MdOutlineLogout } from "react-icons/md";
import { IoMdAddCircle } from "react-icons/io";
import MajorModal from "./MajorModal";
import MajorsList from "./MajorsList";
import { LuPanelLeftClose } from "react-icons/lu";

function Sidebar({ onClose }) {
  const { isPending, logoutUser } = useLogout();

  const addMajor = () => {
    document.getElementById("my_modal_5").showModal();
  };

  return (
    <>
      <MajorModal />
      <aside className="h-screen overflow-y-auto fixed w-80 bg-base-300">
        <div className="flex flex-col h-screen p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Berufsfelder</h3>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              aria-label="Sidebar schließen"
              title="Schließen"
            >
              <LuPanelLeftClose className="text-2xl" />
            </button>
          </div>

          <div>
            <button
              onClick={addMajor}
              className="btn btn-outline btn-primary btn-block mb-4"
            >
              <IoMdAddCircle className="mr-2 text-xl" /> Neues Berufsfeld
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul>
              <MajorsList />
            </ul>
          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={logoutUser}
              disabled={isPending}
              className="btn btn-secondary w-full"
            >
              {isPending ? (
                "Abmelden..."
              ) : (
                <>
                  Abmelden <MdOutlineLogout className="mr-2 text-xl" />
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
