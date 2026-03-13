import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../firebase/config";
import {
  restoreDirection,
  permanentlyDeleteDirection,
} from "../../../../utils/restoreDirection";
import toast from "react-hot-toast";

export default function useDirections() {
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
      }" yo'nalishini BUTUNLAY o'chirmoqchimisiz?\n\n\u26a0\ufe0f Bu amalni qaytarib bo'lmaydi!\n\u26a0\ufe0f Barcha tarixiy ma'lumotlar yo'qoladi!`
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

  return {
    directions,
    loading,
    filter,
    setFilter,
    restoring,
    deleting,
    candidateCounts,
    loadingCounts,
    handleRestore,
    handlePermanentDelete,
    filteredDirections,
    activeCount,
    deletedCount,
  };
}
