import { useLogout } from "../hooks/useLogut";
import { MdOutlineLogout } from "react-icons/md";

function Sidebar() {
  const { isPending, logoutUser } = useLogout();
  return (
    <div className="w-[250px] min-h-screen p-6 bg-base-300 overflow-y-auto relative">
      Sidebar
      <div className="absolute bottom-0 left-0 w-full p-6">
        <button
          onClick={logoutUser}
          disabled={isPending}
          className="btn btn-primary w-full"
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
  );
}

export default Sidebar;
