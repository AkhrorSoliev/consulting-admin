import { useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import { exportFullCandidatesToExcel } from "../../../utils/excelExport";
import { resolveNames } from "./useLiveStats";

export function useExportCandidates(collectionNames) {
  const [exportingAllCandidates, setExportingAllCandidates] = useState(false);

  async function handleExportAllCandidates() {
    if (exportingAllCandidates) return;

    const names = resolveNames(collectionNames);

    if (names.length === 0) {
      toast.error("Keine Berufsfelder gefunden.");
      return;
    }

    setExportingAllCandidates(true);
    toast(
      "Alle Kandidaten werden geladen (aktiv + arxiv + gelöscht)...",
      { duration: 4000 }
    );

    try {
      const allCandidates = [];

      for (const colName of names) {
        try {
          const q = query(
            collection(db, colName),
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            allCandidates.push({
              id: d.id,
              major: colName,
              candidateType: "Aktiv",
              ...d.data(),
            });
          });
        } catch (err) {
          console.error(`Error loading ${colName}:`, err);
        }
      }

      try {
        const archivedQuery = query(
          collection(db, "archived_users"),
          orderBy("archivedAt", "desc")
        );
        const archivedSnap = await getDocs(archivedQuery);
        archivedSnap.docs.forEach((d) => {
          const data = d.data();
          allCandidates.push({
            id: d.id,
            major: data.sourceMajor || data.major || "Archiviert",
            candidateType: "Archiviert",
            ...data,
          });
        });
      } catch (err) {
        console.error("Error loading archived_users:", err);
      }

      try {
        const deletedQuery = query(
          collection(db, "deleted_users"),
          orderBy("deletedAt", "desc")
        );
        const deletedSnap = await getDocs(deletedQuery);
        deletedSnap.docs.forEach((d) => {
          const data = d.data();
          allCandidates.push({
            id: d.id,
            major: data.sourceMajor || data.major || "Gelöscht",
            candidateType: "Gelöscht",
            ...data,
          });
        });
      } catch (err) {
        console.error("Error loading deleted_users:", err);
      }

      if (allCandidates.length === 0) {
        toast.error("Keine Kandidaten gefunden.");
        return;
      }

      exportFullCandidatesToExcel(allCandidates, "Barcha_Kandidatlar");
      toast.success(
        `${allCandidates.length} kandidat eksport qilindi (aktiv + arxiv + o'chirilgan).`
      );
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExportingAllCandidates(false);
    }
  }

  return { exportingAllCandidates, handleExportAllCandidates };
}
