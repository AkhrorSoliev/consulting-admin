import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  restoreDirection,
  permanentlyDeleteDirection,
} from "../../utils/restoreDirection";
import toast from "react-hot-toast";
import {
  FaTrashRestore,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";

export default function DirectionsSettings() {
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, deleted
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [candidateCounts, setCandidateCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "meta"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDirections(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load candidate counts for all directions
  useEffect(() => {
    if (directions.length === 0) return;

    const loadCounts = async () => {
      setLoadingCounts(true);
      const counts = {};

      for (const dir of directions) {
        const colName = dir.collectionName || dir.name;
        if (!colName) continue;

        try {
          const snapshot = await getDocs(collection(db, colName));
          counts[dir.id] = snapshot.docs.length;
        } catch (error) {
          counts[dir.id] = 0;
        }
      }

      setCandidateCounts(counts);
      setLoadingCounts(false);
    };

    loadCounts();
  }, [directions]);

  const handleRestore = async (direction) => {
    try {
      setRestoring(direction.id);
      await restoreDirection(direction.id);
    } catch (error) {
      toast.error(`Xatolik: ${error.message}`);
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (direction) => {
    const confirmed = window.confirm(
      `"${
        direction.title || direction.collectionName
      }" yo'nalishini BUTUNLAY o'chirmoqchimisiz?\n\n⚠️ Bu amalni qaytarib bo'lmaydi!\n⚠️ Barcha tarixiy ma'lumotlar yo'qoladi!`
    );

    if (!confirmed) return;

    try {
      setDeleting(direction.id);
      await permanentlyDeleteDirection(direction.id);
    } catch (error) {
      toast.error(`Xatolik: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const filteredDirections = directions.filter((d) => {
    if (filter === "active") return !d.isDeleted;
    if (filter === "deleted") return d.isDeleted;
    return true; // all
  });

  const activeCount = directions.filter((d) => !d.isDeleted).length;
  const deletedCount = directions.filter((d) => d.isDeleted).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Richtungen Verwaltung</h2>
        <p className="text-base-content/70 mb-3">
          Gelöschte Richtungen wiederherstellen oder dauerhaft löschen
        </p>
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-sm">
            <p className="font-semibold">Wie es funktioniert:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                Zum Löschen einer Richtung die <strong>Sidebar</strong>{" "}
                verwenden
              </li>
              <li>
                Gelöschte Richtungen erscheinen hier im{" "}
                <strong>"Gelöscht"</strong> Tab
              </li>
              <li>
                Mit dem <strong>"Wiederherstellen"</strong> Button die Richtung
                reaktivieren
              </li>
              <li>
                <strong>"Dauerhaft löschen"</strong> - nur bei Bedarf! (kann
                nicht rückgängig gemacht werden)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-200/50 rounded-box border border-base-300">
          <div className="stat-title">Gesamt Richtungen</div>
          <div className="stat-value text-primary">{directions.length}</div>
        </div>
        <div className="stat bg-base-200/50 rounded-box border border-base-300">
          <div className="stat-title">Aktiv</div>
          <div className="stat-value text-success">{activeCount}</div>
        </div>
        <div className="stat bg-base-200/50 rounded-box border border-base-300">
          <div className="stat-title">Gelöscht</div>
          <div className="stat-value text-warning">{deletedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed bg-base-200">
        <button
          className={`tab ${filter === "all" ? "tab-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Alle ({directions.length})
        </button>
        <button
          className={`tab ${filter === "active" ? "tab-active" : ""}`}
          onClick={() => setFilter("active")}
        >
          Aktiv ({activeCount})
        </button>
        <button
          className={`tab ${filter === "deleted" ? "tab-active" : ""}`}
          onClick={() => setFilter("deleted")}
        >
          Gelöscht ({deletedCount})
        </button>
      </div>

      {/* Directions List */}
      <div className="space-y-3">
        {filteredDirections.length === 0 ? (
          <div className="text-center py-12 opacity-70">
            <p>Keine Richtungen gefunden</p>
          </div>
        ) : (
          filteredDirections.map((direction) => (
            <div
              key={direction.id}
              className={`card bg-base-100 border ${
                direction.isDeleted ? "border-warning/30" : "border-base-300"
              } shadow-sm`}
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {direction.title || direction.collectionName}
                      </h3>
                      {direction.isDeleted ? (
                        <span className="badge badge-warning badge-sm gap-1">
                          <FaTimesCircle className="h-3 w-3" />
                          Gelöscht
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm gap-1">
                          <FaCheckCircle className="h-3 w-3" />
                          Aktiv
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-base-content/60 space-y-1">
                      <p>
                        <span className="font-medium">Collection:</span>{" "}
                        {direction.collectionName}
                      </p>
                      <p>
                        <span className="font-medium">UUID:</span>{" "}
                        <code className="text-xs bg-base-200 px-1 rounded">
                          {direction.uuid || direction.id}
                        </code>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaUsers className="h-3 w-3" />
                        <span className="font-medium">Kandidaten:</span>{" "}
                        {loadingCounts ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <span
                            className={`font-semibold ${
                              candidateCounts[direction.id] > 0
                                ? "text-primary"
                                : ""
                            }`}
                          >
                            {candidateCounts[direction.id] || 0}
                          </span>
                        )}
                      </p>
                      {direction.candidatesCountAtDeletion !== undefined && (
                        <p className="text-warning">
                          <span className="font-medium">Bei Löschung:</span>{" "}
                          {direction.candidatesCountAtDeletion} Kandidaten
                          vorhanden
                        </p>
                      )}
                      {direction.deletedAt && (
                        <p>
                          <span className="font-medium">Gelöscht:</span>{" "}
                          {new Date(direction.deletedAt).toLocaleString(
                            "uz-UZ"
                          )}
                        </p>
                      )}
                      {direction.restoredAt && (
                        <p>
                          <span className="font-medium">
                            Wiederhergestellt:
                          </span>{" "}
                          {new Date(direction.restoredAt).toLocaleString(
                            "uz-UZ"
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {direction.isDeleted ? (
                      <>
                        <button
                          className="btn btn-success btn-sm gap-2"
                          onClick={() => handleRestore(direction)}
                          disabled={restoring === direction.id}
                        >
                          {restoring === direction.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FaTrashRestore />
                          )}
                          Wiederherstellen
                        </button>
                        <button
                          className="btn btn-error btn-sm gap-2"
                          onClick={() => handlePermanentDelete(direction)}
                          disabled={deleting === direction.id}
                        >
                          {deleting === direction.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FaTrash />
                          )}
                          Dauerhaft löschen
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        <div className="badge badge-success badge-outline mb-2">
                          Aktive Richtung
                        </div>
                        <div className="text-xs text-base-content/50">
                          Zum Löschen Sidebar verwenden
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Warning */}
      {deletedCount > 0 && (
        <div className="alert alert-warning">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Wichtige Informationen!</h3>
            <div className="text-sm space-y-1">
              <p>✅ Gelöschte Richtungen werden in Stats nicht angezeigt</p>
              <p>✅ Kandidaten bleiben erhalten und gehen nicht verloren</p>
              <p>
                ✅ Bei Wiederherstellung der Richtung kommen alle Kandidaten
                zurück
              </p>
              <p>
                ⚠️ "Dauerhaft löschen" löscht das Meta-Dokument vollständig
                (Kandidaten bleiben erhalten)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
