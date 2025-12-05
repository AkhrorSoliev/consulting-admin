import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { FaEnvelope, FaPhone, FaRing, FaTrash } from "react-icons/fa";
import { deleteDocumentById } from "../utils";

function CollectionCv() {
  const { major } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function calculateAgeFromDDMMYYYY(value) {
    try {
      if (!value || typeof value !== "string") return null;
      const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (!m) return null;
      const [, dd, mm, yyyy] = m;
      const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (Number.isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 1 || age > 120) return null;
      return age;
    } catch {
      return null;
    }
  }

  const title = useMemo(() => {
    const n = String(major || "").trim();
    return n ? n : "—";
  }, [major]);

  const filteredItems = useMemo(() => {
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return items;
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return items;
    return items.filter((it) => {
      const name = String(it.name || "").toLowerCase();
      return tokens.every((t) => name.includes(t));
    });
  }, [items, searchQuery]);

  useEffect(() => {
    const name = String(major || "").trim();
    if (!name) {
      toast.error("Name des Berufsfelds nicht gefunden.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, name), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          const pd = data.persoenlicheDaten || {};
          const fullName = pd.name || "";
          const age = calculateAgeFromDDMMYYYY(pd.geburtsdatum);
          return {
            id: d.id,
            createdAt: data.createdAt || 0,
            name: fullName,
            age,
            photo: pd.foto || "",
            phone: pd.telefon || "",
            email: pd.email || "",
            maritalStatus: pd.familienstand || "",
          };
        });
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Fehler beim Laden der Daten.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [major]);

  async function handleDelete(itemId, displayName) {
    const colName = String(major || "").trim();
    if (!colName || !itemId) return;
    const ok = window.confirm(
      `Möchten Sie „${displayName || "Kandidat"}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`
    );
    if (!ok) return;
    try {
      setDeletingId(itemId);
      await deleteDocumentById(colName, itemId);
      toast.success("Kandidat erfolgreich gelöscht.");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="mx-auto">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Berufsfeld: <span className="text-primary">{title}</span>
            </h1>
            <p className="text-sm opacity-70">
              Gefunden: {loading ? "..." : filteredItems.length} Kandidaten
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <input
              type="search"
              id="search"
              name="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-64"
              placeholder="Nach Name suchen..."
              aria-label="Nach Name suchen"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center py-24">
            <div className="text-center opacity-70">
              <p className="text-lg">Derzeit keine Daten vorhanden.</p>
              <p className="text-sm">
                Die Liste der Kandidaten erscheint hier.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="grid place-items-center py-24">
            <div className="text-center opacity-70">
              <p className="text-lg">Keine Ergebnisse gefunden.</p>
              <p className="text-sm mb-6">
                Versuchen Sie es mit einem anderen Namen.
              </p>
              <button
                className="btn btn-sm btn-outline btn-primary"
                onClick={() => setSearchQuery("")}
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="card relative group bg-base-100 border border-base-300/60 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/generate/${major}/${item.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/generate/${major}/${item.id}`);
                  }
                }}
              >
                <div className="card-body">
                  <button
                    className="btn btn-circle btn-ghost btn-xs text-error absolute right-2 top-2 opacity-70 hover:opacity-100 hover:bg-error/10 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.name);
                    }}
                    disabled={deletingId === item.id}
                    title="Löschen"
                    aria-label="Löschen"
                  >
                    {deletingId === item.id ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <FaTrash className="text-xl" />
                    )}
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full ring ring-primary/20 ring-offset-base-100 ring-offset-2 overflow-hidden">
                        {item.photo ? (
                          <img src={item.photo} alt={item.name || "Foto"} />
                        ) : (
                          <div className="w-full h-full bg-base-300 grid place-items-center text-base-content/60 text-sm">
                            Kein Foto
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="card-title text-base md:text-lg leading-tight">
                          {item.name || "Ohne Namen"}
                        </h2>
                      </div>
                      <div>
                        {typeof item.age === "number" && item.age >= 1 ? (
                          <span className="badge badge-primary badge-outline">
                            {item.age} Jahre
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    {item.phone ? (
                      <div className="flex items-center gap-2">
                        <FaPhone className="opacity-70" />
                        <span className="font-medium">{item.phone}</span>
                      </div>
                    ) : null}
                    {item.email ? (
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="opacity-70" />
                        <span className="font-medium break-all">
                          {item.email}
                        </span>
                      </div>
                    ) : null}
                    {item.maritalStatus ? (
                      <div className="flex items-center gap-2">
                        <FaRing className="opacity-70" />
                        <span className="font-medium">
                          {item.maritalStatus}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionCv;
