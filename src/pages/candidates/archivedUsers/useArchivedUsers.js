import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { subscribeToCollections } from "../../../utils";
import { db } from "../../../firebase/config";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
} from "firebase/firestore";

export default function useArchivedUsers({ isPrivileged }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [majors, setMajors] = useState([]);

  async function load() {
    if (!isPrivileged) return;
    try {
      setLoading(true);
      const q = fsQuery(
        collection(db, "archived_users"),
        orderBy("archivedAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Fehler beim Laden (Archiv).");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub?.();
  }, []);

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

  const leadStats = useMemo(() => {
    const byLead = {};
    let telegramCount = 0;
    items.forEach((r) => {
      const lead = String(r?.lead || "").trim();
      if (lead) {
        byLead[lead] = (byLead[lead] || 0) + 1;
      }
      if (r?.telegramId) {
        telegramCount++;
      }
    });
    const leadList = Object.entries(byLead)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { leadList, telegramCount, total: items.length };
  }, [items]);

  return {
    loading,
    items,
    query,
    setQuery,
    majors,
    filtered,
    leadStats,
    load,
  };
}
