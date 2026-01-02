import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useUserRole from "../../hooks/useUserRole";
import { listRemoteUsers } from "../../utils";
import RemoteUserCard from "../../components/RemoteUserCard";

export default function CandidatesAllUsers() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  async function load() {
    if (!isPrivileged) return;
    try {
      setLoading(true);
      const data = await listRemoteUsers("all");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Fehler beim Laden der Benutzerliste.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  const filtered = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const name =
        String(r?.persoenlicheDaten?.name || "") +
        " " +
        String(r?.persoenlicheDaten?.nachname || "");
      const email = String(r?.persoenlicheDaten?.email || r?.email || "");
      const major = String(r?.major || "");
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        major.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  if (!loadingRole && !isPrivileged) {
    return (
      <div className="text-sm text-base-content/70">Keine Berechtigung.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Alle Benutzer</div>
          <div className="text-xs text-base-content/60">
            Quelle: json-api.uz (all_users)
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            className="input input-bordered w-full sm:w-72"
            placeholder="Suche (Name / Email / Major)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={load}
            disabled={loading}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-box border border-base-300 bg-base-200/30 text-sm text-base-content/70">
          Keine Benutzer gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((r, idx) => {
            const first = String(r?.persoenlicheDaten?.name || "").trim();
            const last = String(r?.persoenlicheDaten?.nachname || "").trim();
            const full = [first, last].filter(Boolean).join(" ") || "—";
            const email =
              String(r?.persoenlicheDaten?.email || r?.email || "").trim() ||
              "—";
            const photo =
              String(
                r?.persoenlicheDaten?.foto || r?.foto || r?.photo || ""
              ).trim() || "";
            const major = String(r?.major || "").trim() || "—";
            const firebaseId = String(r?.firebaseId || "").trim() || "—";
            return (
              <RemoteUserCard
                key={String(r?.firebaseId || "") || String(idx)}
                name={full}
                photo={photo}
                email={email === "—" ? "" : email}
                major={major === "—" ? "" : major}
                firebaseId={firebaseId === "—" ? "" : firebaseId}
                tone="primary"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
