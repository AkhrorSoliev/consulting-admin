import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordModal({
  pwModalUser,
  pw1,
  setPw1,
  pw2,
  setPw2,
  showPw1,
  setShowPw1,
  showPw2,
  setShowPw2,
  loading,
  handlePwSubmit,
  closePwModal,
}) {
  return (
    <dialog
      id="set_password_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg">Passwort ändern</h3>
        <p className="text-sm opacity-70 mt-1">
          Für:{" "}
          <span className="font-medium">{pwModalUser?.email || "—"}</span>
        </p>

        <form
          onSubmit={handlePwSubmit}
          className="mt-4 space-y-3"
          autoComplete="off"
        >
          <div>
            <label className="label" htmlFor="new-password-1">
              <span className="label-text">Neues Passwort</span>
            </label>
            <div className="relative">
              <input
                id="new-password-1"
                type={showPw1 ? "text" : "password"}
                className="input input-bordered w-full pr-10"
                placeholder="Mindestens 6 Zeichen"
                name="modal-new-password"
                autoComplete="new-password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/70 hover:text-base-content z-10 focus:outline-none focus-visible:outline-none"
                onClick={() => setShowPw1((prev) => !prev)}
                disabled={loading}
                aria-label={
                  showPw1 ? "Passwort verbergen" : "Passwort anzeigen"
                }
              >
                {showPw1 ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="new-password-2">
              <span className="label-text">Neues Passwort bestätigen</span>
            </label>
            <div className="relative">
              <input
                id="new-password-2"
                type={showPw2 ? "text" : "password"}
                className="input input-bordered w-full pr-10"
                placeholder="Noch einmal eingeben"
                name="modal-new-password-confirm"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/70 hover:text-base-content z-10 focus:outline-none focus-visible:outline-none"
                onClick={() => setShowPw2((prev) => !prev)}
                disabled={loading}
                aria-label={
                  showPw2 ? "Passwort verbergen" : "Passwort anzeigen"
                }
              >
                {showPw2 ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                loading ||
                !pwModalUser?.uid ||
                String(pw1 || "").trim().length < 6 ||
                pw1 !== pw2
              }
            >
              Speichern
            </button>
            <button
              type="button"
              className="btn"
              onClick={closePwModal}
              disabled={loading}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={closePwModal}>
          close
        </button>
      </form>
    </dialog>
  );
}
