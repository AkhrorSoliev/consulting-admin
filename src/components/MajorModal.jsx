import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { createCollection } from "../utils";
import { useUserRole } from "../hooks/useUserRole";

function MajorModal() {
  const [input, setInput] = useState("");
  const { user } = useSelector((state) => state.auth);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);
  const closeModal = () => {
    document.getElementById("my_modal_5").close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Berufsfelder hinzuzufügen.");
      return;
    }
    const raw = String(input || "").trim();
    if (!raw) {
      toast.error("Der Name des Berufsfelds wurde nicht eingegeben.");
      return;
    }
    const createdBy =
      user?.email || user?.displayName || user?.uid || user?.phoneNumber || "";
    const { created } = await createCollection(raw, createdBy);
    if (created) {
      setInput("");
      closeModal();
    }
  };
  return (
    <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-5">Berufsfeld hinzufügen</h3>

        <form onSubmit={handleSubmit}>
          <label className="label" htmlFor="major-name">
            <span className="label-text">Name des Berufsfelds</span>
          </label>
          <input
            id="major-name"
            type="text"
            placeholder="Hier eingeben"
            className="input input-bordered w-full"
            disabled={isLimitedAdmin}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="modal-action">
            <button className="btn btn-secondary" disabled={isLimitedAdmin}>
              Hinzufügen
            </button>
            <button type="button" onClick={closeModal} className="btn">
              Schließen
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default MajorModal;
