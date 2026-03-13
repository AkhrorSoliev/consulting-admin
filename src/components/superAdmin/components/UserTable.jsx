import { FiTrash2 } from "react-icons/fi";
import { ROLE_OPTIONS } from "../hooks/useUserManagement";

export default function UserTable({
  users,
  roleDrafts,
  loading,
  handleRoleChange,
  handleSetRole,
  handleDisable,
  handleEnable,
  handleDelete,
  openPwModal,
}) {
  return (
    <div className="overflow-x-auto border border-base-300 rounded-box">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rolle</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="text-center text-sm text-base-content/60"
              >
                {loading ? "Wird geladen..." : "Keine Benutzer gefunden"}
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.uid}>
                <td className="max-w-[240px] truncate">{u.email || "—"}</td>
                <td>
                  <div className="flex items-center">
                    <select
                      className="select select-bordered select-xs w-[148px]"
                      value={roleDrafts[u.uid] || "user"}
                      onChange={(e) =>
                        handleRoleChange(u.uid, e.target.value)
                      }
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
                  <span
                    className={`badge ${u.disabled ? "badge-error" : "badge-success"
                      }`}
                  >
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
  );
}
