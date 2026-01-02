import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { createCollection } from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase/config";

function MajorModal() {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const { user } = useSelector((state) => state.auth);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);
  const closeModal = () => {
    setInput("");
    setValidationError("");
    document.getElementById("my_modal_5").close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (isLimitedAdmin) {
      setValidationError(
        "Sie haben keine Berechtigung, Berufsfelder hinzuzufügen."
      );
      return;
    }

    const raw = String(input || "").trim();
    if (!raw) {
      setValidationError("Der Name des Berufsfelds wurde nicht eingegeben.");
      return;
    }

    const normalizedName = raw.trim().toLowerCase().replace(/\s+/g, "-");

    try {
      const dupSnap = await getDocs(
        query(
          collection(db, "meta"),
          where("collectionName", "==", normalizedName),
          limit(1)
        )
      );

      if (!dupSnap.empty) {
        setValidationError(`„${normalizedName}" ist bereits vorhanden.`);
        return;
      }

      const createdBy =
        user?.email ||
        user?.displayName ||
        user?.uid ||
        user?.phoneNumber ||
        "";
      const { created } = await createCollection(raw, createdBy);
      if (created) {
        setInput("");
        setValidationError("");
        closeModal();
      }
    } catch (error) {
      setValidationError(`Fehler: ${error.message}`);
    }
  };
  return (
    <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-5">Berufsfeld hinzufügen</h3>

        {validationError && (
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

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
            onChange={(e) => {
              setInput(e.target.value);
              setValidationError("");
            }}
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
