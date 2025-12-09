import { useState } from "react";
import toast from "react-hot-toast";
import { createCollection } from "../utils";

function MajorModal() {
  const [input, setInput] = useState("");
  const closeModal = () => {
    document.getElementById("my_modal_5").close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = String(input || "").trim();
    if (!raw) {
      toast.error("Der Name des Berufsfelds wurde nicht eingegeben.");
      return;
    }
    const { created } = await createCollection(raw);
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="modal-action">
            <button className="btn btn-secondary">Hinzufügen</button>
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
