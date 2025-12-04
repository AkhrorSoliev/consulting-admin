import { useState } from "react";
import { createCollection } from "../utils";

function MajorModal() {
  const [input, setInput] = useState("");
  const closeModal = () => {
    document.getElementById("my_modal_5").close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCollection(input.trim().toLowerCase().replace(/\s+/g, "-"));
    setInput("");
    closeModal();
  };
  return (
    <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-5">Yo'nalish Qo'shing</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type here"
            className="input w-full"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="modal-action">
            <button className="btn btn-secondary">Qo'shish</button>
            <button onClick={closeModal} className="btn">
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default MajorModal;
