import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaEye, FaTrashRestore } from "react-icons/fa";
import { restoreDirection } from "../../utils/restoreDirection";
import toast from "react-hot-toast";

export default function CandidatesArchivedDirections() {
  const [archivedDirections, setArchivedDirections] = useState([]);
  const [candidateCounts, setCandidateCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load archived (soft-deleted) directions
    const q = query(
      collection(db, "meta"),
      where("isDeleted", "==", true),
      orderBy("deletedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArchivedDirections(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load candidate counts for archived directions
  useEffect(() => {
    if (archivedDirections.length === 0) return;

    const loadCounts = async () => {
      setLoadingCounts(true);
      const counts = {};

      for (const dir of archivedDirections) {
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
  }, [archivedDirections]);

  const handleViewCandidates = (direction) => {
    const colName = direction.collectionName || direction.name;
    navigate(`/collectionCv/${colName}`);
  };

  const handleRestore = async (direction) => {
    try {
      setRestoring(direction.id);
      await restoreDirection(direction.id);
      toast.success("Yo'nalish qayta tiklandi! Endi Sidebar da ko'rinadi.");
    } catch (error) {
      toast.error(`Xatolik: ${error.message}`);
    } finally {
      setRestoring(null);
    }
  };

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
        <h2 className="text-2xl font-bold mb-2">
          Arxivlangan Yo'nalishlar va Kandidatlar
        </h2>
        <p className="text-base-content/70">
          O'chirilgan yo'nalishlardagi kandidatlarni ko'rish va boshqarish
        </p>
      </div>

      {/* Info Alert */}
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
          <p className="font-semibold">Muhim ma'lumot:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>O'chirilgan yo'nalishlardagi kandidatlar saqlanadi</li>
            <li>Kandidatlarni ko'rish va tahrirlash mumkin</li>
            <li>
              Yo'nalishni qayta tiklash orqali Sidebar ga qaytarish mumkin
            </li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">Arxivlangan Yo'nalishlar</div>
          <div className="stat-value text-warning">
            {archivedDirections.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Jami Kandidatlar</div>
          <div className="stat-value text-primary">
            {loadingCounts ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              Object.values(candidateCounts).reduce(
                (sum, count) => sum + count,
                0
              )
            )}
          </div>
        </div>
      </div>

      {/* Archived Directions List */}
      {archivedDirections.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <h3 className="text-xl font-medium">Arxivlangan yo'nalishlar yo'q</h3>
          <p className="mt-2">Barcha yo'nalishlar faol holatda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedDirections.map((direction) => (
            <div
              key={direction.id}
              className="card bg-base-100 border border-warning/30 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="card-title text-lg">
                    {direction.title || direction.collectionName}
                  </h3>
                  <span className="badge badge-warning badge-sm">Arxiv</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUsers className="h-4 w-4 text-primary" />
                    <span className="font-medium">Kandidatlar:</span>
                    {loadingCounts ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <span className="font-bold text-primary">
                        {candidateCounts[direction.id] || 0}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-base-content/60">
                    <p>
                      <span className="font-medium">Collection:</span>{" "}
                      {direction.collectionName}
                    </p>
                    {direction.deletedAt && (
                      <p>
                        <span className="font-medium">O'chirilgan:</span>{" "}
                        {new Date(direction.deletedAt).toLocaleString("uz-UZ")}
                      </p>
                    )}
                    {direction.candidatesCountAtDeletion !== undefined && (
                      <p className="text-warning">
                        O'chirilganda: {direction.candidatesCountAtDeletion} ta
                      </p>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-4 gap-2">
                  <button
                    className="btn btn-sm btn-primary gap-2"
                    onClick={() => handleViewCandidates(direction)}
                    disabled={!candidateCounts[direction.id]}
                  >
                    <FaEye />
                    Ko'rish
                  </button>
                  <button
                    className="btn btn-sm btn-success gap-2"
                    onClick={() => handleRestore(direction)}
                    disabled={restoring === direction.id}
                  >
                    {restoring === direction.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <FaTrashRestore />
                    )}
                    Tiklash
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
