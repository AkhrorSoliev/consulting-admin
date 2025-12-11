import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { FaEnvelope, FaPhone, FaRing, FaTrash } from "react-icons/fa";
import { deleteDocumentById } from "../utils";
import { useUserRole } from "../hooks/useUserRole";

function CollectionCv() {
  const { major } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { role } = useUserRole();
  const isLimitedAdmin = role === "limited_admin";

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
          const firstName = String(pd.name || "").trim();
          const lastName = String(pd.nachname || "").trim();
          const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
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
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(major || "").trim();
    if (!colName || !itemId) return;
    const ok = window.confirm(
      `Möchten Sie „${
        displayName || "Kandidat"
      }“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
                onClick={() => navigate(`/generate/${major}/${item.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/generate/${major}/${item.id}`);
                  }
                }}
              >
                <div className="card-body p-5 flex flex-col h-full">
                  {!isLimitedAdmin && (
                    <div className="absolute top-2 right-2">
                      <button
                        className="btn btn-ghost btn-circle btn-sm text-error/70 hover:text-error hover:bg-error/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id, item.name);
                        }}
                        disabled={deletingId === item.id}
                        title="Löschen"
                      >
                        {deletingId === item.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FaTrash size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center gap-3 mb-4">
                    <div className="avatar">
                      <div className="w-24 h-24 rounded-full ring-2 ring-primary/20 ring-offset-base-100 ring-offset-2 overflow-hidden shadow-sm">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.name || "Foto"}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-base-200 flex items-center justify-center text-base-content/50 text-xs font-medium">
                            Kein Foto
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-1">
                      <h2
                        className="font-bold text-lg leading-tight truncate px-2"
                        title={item.name || "Ohne Namen"}
                      >
                        {item.name || "Ohne Namen"}
                      </h2>
                      {typeof item.age === "number" && item.age >= 1 && (
                        <div className="badge badge-primary badge-outline badge-sm">
                          {item.age} Jahre
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto space-y-2 text-sm w-full bg-base-200/50 p-3 rounded-lg">
                    {item.phone && (
                      <div className="flex items-center gap-3 text-base-content/80 overflow-hidden">
                        <FaPhone className="flex-shrink-0 text-primary w-4" />
                        <span
                          className="truncate font-medium"
                          title={item.phone}
                        >
                          {item.phone}
                        </span>
                      </div>
                    )}

                    {item.email && (
                      <div className="flex items-center gap-3 text-base-content/80 overflow-hidden">
                        <FaEnvelope className="flex-shrink-0 text-primary w-4" />
                        <span
                          className="truncate font-medium"
                          title={item.email}
                        >
                          {item.email}
                        </span>
                      </div>
                    )}

                    {item.maritalStatus && (
                      <div className="flex items-center gap-3 text-base-content/80 overflow-hidden">
                        <FaRing className="flex-shrink-0 text-primary w-4" />
                        <span
                          className="truncate font-medium"
                          title={item.maritalStatus}
                        >
                          {item.maritalStatus}
                        </span>
                      </div>
                    )}

                    {/* Agar ma'lumotlar bo'lmasa bo'sh joy ko'rsatmaslik uchun */}
                    {!item.phone && !item.email && !item.maritalStatus && (
                      <div className="text-center text-xs text-base-content/40 py-2">
                        Keine Kontaktdaten
                      </div>
                    )}
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
