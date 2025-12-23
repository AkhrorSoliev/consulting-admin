import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiRefreshCw, FiTrash2, FiSlash, FiCheck } from "react-icons/fi";
import { functions } from "../firebase/config";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "limited_admin", label: "Limited Admin" },
  { value: "user", label: "User" },
];

function sortByCreatedDesc(list) {
  const toTs = (item) => {
    if (Number.isFinite(item?.createdAtTs)) return item.createdAtTs;
    const t = Date.parse(item?.createdAt);
    return Number.isFinite(t) ? t : 0;
  };
  return [...list].sort((a, b) => toTs(b) - toTs(a));
}

function SuperAdminUserManagement() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwModalUser, setPwModalUser] = useState(null); // { uid, email }
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});

  const call = (name) => httpsCallable(functions, name);
  const closePwModal = () => {
    const el = document.getElementById("set_password_modal");
    el?.close?.();
    setPwModalUser(null);
    setPw1("");
    setPw2("");
    setShowPw1(false);
    setShowPw2(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch a generous page size; backend caps at 100.
      const res = await call("listUsers")({ pageSize: 100 });
      const payload = res?.data || {};
      const list = Array.isArray(payload.users) ? payload.users : [];
      // Hide super_admin entries from the table and show newest first.
      const visible = sortByCreatedDesc(
        list.filter((u) => u.role !== "super_admin")
      );
      setUsers(visible);
      setRoleDrafts(() => {
        const next = {};
        visible.forEach((u) => {
          next[u.uid] = u.role || "user";
        });
        return next;
      });
    } catch (err) {
      toast.error(err?.message || "Benutzerliste konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const e = String(email || "").trim();
    const p = String(password || "");
    if (!e || !p) {
      toast.error("E-Mail und Passwort sind erforderlich.");
      return;
    }
    setLoading(true);
    try {
      const res = await call("createUser")({ email: e, password: p });
      toast.success(`Benutzer erstellt: ${res?.data?.email || e}`);
      setEmail("");
      setPassword("");
      setShowCreatePassword(false);
      setTokenStack([]);
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Benutzer konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (uid, value) => {
    if (!uid) return;
    setRoleDrafts((prev) => ({ ...prev, [uid]: value }));
  };

  const handleSetRole = async (uid) => {
    if (!uid) return;
    const role = roleDrafts[uid];
    if (!role) {
      toast.error("Rolle auswählen.");
      return;
    }
    setLoading(true);
    try {
      await call("setUserRole")({ uid, role });
      toast.success("Rolle wurde aktualisiert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Rolle konnte nicht aktualisiert werden.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      await call("disableUser")({ uid });
      toast.success("Benutzer wurde deaktiviert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Deaktivieren fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      await call("enableUser")({ uid });
      toast.success("Benutzer wurde aktiviert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Aktivieren fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid) => {
    if (!uid) return;
    const ok = window.confirm(
      "Möchten Sie diesen Benutzer wirklich dauerhaft löschen?"
    );
    if (!ok) return;
    setLoading(true);
    try {
      await call("deleteUser")({ uid });
      toast.success("Benutzer wurde gelöscht.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Löschen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const openPwModal = (uid, userEmail) => {
    if (!uid) return;
    setPwModalUser({ uid, email: userEmail || null });
    setPw1("");
    setPw2("");
    setShowPw1(false);
    setShowPw2(false);
    const el = document.getElementById("set_password_modal");
    el?.showModal?.();
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (!pwModalUser?.uid) return;

    const p1 = String(pw1 || "");
    const p2 = String(pw2 || "");

    if (p1.trim().length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (p1 !== p2) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      await call("setUserPassword")({ uid: pwModalUser.uid, password: p1 });
      toast.success("Passwort wurde aktualisiert.");
      closePwModal();
    } catch (err) {
      toast.error(err?.message || "Passwort ändern fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 rounded-box bg-base-100/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 px-4 py-3 shadow">
            <span className="loading loading-spinner loading-md" />
            <span className="text-sm">Bitte warten...</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Benutzerverwaltung</h2>
        <button
          type="button"
          className={`btn btn-sm btn-outline btn-square ${loading ? "btn-disabled" : ""}`}
          onClick={() => loadUsers()}
          disabled={loading}
          aria-label="Aktualisieren"
          title="Aktualisieren"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <FiRefreshCw size={16} />
          )}
        </button>
      </div>

      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={handleCreateUser}
        autoComplete="off"
      >
        <input
          className="input input-bordered w-full md:col-span-1"
          type="email"
          placeholder="user@email.com"
          name="new-user-email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <div className="relative md:col-span-1">
          <input
            className="input input-bordered w-full pr-10"
            type={showCreatePassword ? "text" : "password"}
            placeholder="Passwort (min 6)"
            name="new-user-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/70 hover:text-base-content z-10 focus:outline-none focus-visible:outline-none"
            onClick={() => setShowCreatePassword((prev) => !prev)}
            disabled={loading}
            aria-label={showCreatePassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showCreatePassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-primary md:col-span-1"
          disabled={loading}
        >
          {loading ? "Erstellen..." : "Benutzer erstellen"}
        </button>
      </form>

      <div className="overflow-x-auto border border-base-300 rounded-box">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Email</th>
              <th>UID</th>
              <th>Rolle</th>
              <th>Status</th>
              <th className="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-sm text-base-content/60">
                  {loading ? "Wird geladen..." : "Keine Benutzer gefunden"}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.uid}>
                  <td className="max-w-[240px] truncate">{u.email || "—"}</td>
                  <td className="font-mono text-xs max-w-[220px] truncate">{u.uid}</td>
                  <td>
                    <div className="flex items-center">
                      <select
                        className="select select-bordered select-xs w-[148px]"
                        value={roleDrafts[u.uid] || "user"}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                        disabled={loading}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.disabled ? "badge-error" : "badge-success"}`}>
                      {u.disabled ? "deaktiviert" : "aktiv"}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => handleSetRole(u.uid)}
                      disabled={loading || !roleDrafts[u.uid]}
                    >
                      Rolle speichern
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => openPwModal(u.uid, u.email)}
                      disabled={loading}
                    >
                      Passwort ändern
                    </button>
                    {u.disabled ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => handleEnable(u.uid)}
                        disabled={loading}
                      >
                        Aktivieren
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => handleDisable(u.uid)}
                        disabled={loading}
                      >
                        Deaktivieren
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-xs btn-error btn-square"
                      onClick={() => handleDelete(u.uid)}
                      disabled={loading}
                      aria-label="Löschen"
                      title="Löschen"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <dialog id="set_password_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg">Passwort ändern</h3>
          <p className="text-sm opacity-70 mt-1">
            Für:{" "}
            <span className="font-medium">
              {pwModalUser?.email || pwModalUser?.uid || "—"}
            </span>
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
                  aria-label={showPw1 ? "Passwort verbergen" : "Passwort anzeigen"}
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
                  aria-label={showPw2 ? "Passwort verbergen" : "Passwort anzeigen"}
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
    </div>
  );
}

export default SuperAdminUserManagement;


