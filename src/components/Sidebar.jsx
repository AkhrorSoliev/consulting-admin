import { useLogout } from "../hooks/useLogut";
import { MdOutlineLogout } from "react-icons/md";
import { IoMdAddCircle } from "react-icons/io";
import MajorModal from "./MajorModal";
import MajorsList from "./MajorsList";

function Sidebar() {
  const { isPending, logoutUser } = useLogout();

  const addMajor = () => {
    document.getElementById("my_modal_5").showModal();
  };

  return (
    <>
      <MajorModal />
      <div className="w-[250px] h-screen p-6 bg-base-300 overflow-y-auto relative pt-44">
        <div
          className="fixed top-0 left-0 w-full p-6 bg-base-300"
          style={{ width: "inherit" }}
        >
          <h3 className="text-center text-xl font-bold mb-6">Berufsfelder</h3>
          <button
            onClick={addMajor}
            className="btn btn-outline btn-primary btn-block mb-6"
          >
            <IoMdAddCircle className="mr-2 text-xl" /> Neues Berufsfeld
          </button>
        </div>
        <div className="overflow-y-auto pb-24">
          <ul>
            <MajorsList />
          </ul>
        </div>
        <div
          className="fixed bottom-0 left-0 p-6 bg-base-300 shadow-md"
          style={{ width: "inherit" }}
        >
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
    </>
  );
}

export default Sidebar;
