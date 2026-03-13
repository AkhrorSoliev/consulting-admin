import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../../../firebase/config";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
} from "firebase/firestore";
import { subscribeToCollections } from "../../../utils";

const ITEMS_PER_PAGE = 20;

export default function useDeletedUsers(isPrivileged) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [majors, setMajors] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  // Cleanup old localStorage data on mount
  useEffect(() => {
    try {
      localStorage.removeItem("deletedUsersSelectedKeys");
    } catch {}
  }, []);

  async function load() {
    if (!isPrivileged) return;
    try {
      setLoading(true);
      const q = fsQuery(
        collection(db, "deleted_users"),
        orderBy("deletedAt", "desc"),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Fehler beim Laden (Gelöschte).");
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

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

  function toggleSelect(key) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function clearSelection() {
    setSelectedKeys([]);
  }

  return {
    loading,
    items,
    query,
    setQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filtered,
    paginatedItems,
    itemsPerPage: ITEMS_PER_PAGE,
    majors,
    leadStats,
    selectedKeys,
    toggleSelect,
    clearSelection,
    load,
  };
}
