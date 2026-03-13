import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useNavigate } from "react-router-dom";
import { restoreDirection } from "../../../utils/restoreDirection";
import toast from "react-hot-toast";

export default function useArchivedDirections() {
  const [archivedDirections, setArchivedDirections] = useState([]);
  const [candidateCounts, setCandidateCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  return {
    archivedDirections,
    candidateCounts,
    loading,
    loadingCounts,
    restoring,
    handleViewCandidates,
    handleRestore,
  };
}
