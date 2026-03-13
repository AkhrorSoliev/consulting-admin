import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { getMetaByName } from "../../../utils";
import { toDateFromMetaCreatedAt } from "../utils";
import { mapCandidate } from "../mapCandidate";

export function useCollectionData() {
  const { major } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [resolvingMajor, setResolvingMajor] = useState(true);
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  const title = useMemo(() => {
    const n = String(resolvedMajor?.title || "").trim();
    return n || "\u2014";
  }, [resolvedMajor]);

  const majorCreatedAtLabel = useMemo(() => {
    const d = toDateFromMetaCreatedAt(metaInfo?.createdAt);
    if (!d) return "\u2014";
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tashkent",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }, [metaInfo]);

  const majorCreatedByLabel = useMemo(() => {
    const v = String(metaInfo?.createdBy || "").trim();
    return v || "System";
  }, [metaInfo]);

  // Resolve major from URL param
  useEffect(() => {
    const key = String(major || "").trim();
    let cancelled = false;
    setResolvingMajor(true);
    setMetaLoading(true);
    (async () => {
      try {
        if (!key) {
          setResolvedMajor({ collectionName: "", title: "", linkId: "" });
          setMetaInfo(null);
          setLoading(false);
          return;
        }
        const meta = await getMetaByName(key);
        if (cancelled) return;
        if (meta) {
          setResolvedMajor({
            collectionName: meta.collectionName || meta.slug || meta.name || key,
            title: meta.title || meta.collectionName || key,
            linkId: meta.linkId || meta.uuid || meta.id || key,
          });
          setMetaInfo(meta);
        } else {
          setResolvedMajor({ collectionName: key, title: key, linkId: key });
          setMetaInfo(null);
        }
      } catch (e) {
        if (!cancelled) {
          setResolvedMajor({ collectionName: key, title: key, linkId: key });
          setMetaInfo(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
        if (!cancelled) setResolvingMajor(false);
      }
    })();
    return () => { cancelled = true; };
  }, [major]);

  // Subscribe to Firestore collection
  useEffect(() => {
    const name = String(resolvedMajor?.collectionName || "").trim();
    if (!name) {
      if (!metaLoading && !resolvingMajor) {
        toast.error("Name des Berufsfelds nicht gefunden.");
        setLoading(false);
      }
      return undefined;
    }

    const q = query(collection(db, name), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => mapCandidate(d));
        setItems(list);
        setLoading(false);
      },
      () => {
        toast.error("Fehler beim Laden der Daten.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, metaLoading, resolvingMajor]);

  const statistics = useMemo(() => {
    if (!items.length) return null;
    const total = items.length;
    const withEmail = items.filter((item) => (item.emailSentCount || 0) > 0).length;
    const withoutEmail = total - withEmail;
    const withComment = items.filter((item) => item.hasComment).length;
    const withoutComment = total - withComment;
    return { total, withEmail, withoutEmail, withComment, withoutComment };
  }, [items]);

  const leadStats = useMemo(() => {
    const byLead = {};
    let telegramCount = 0;
    items.forEach((item) => {
      const lead = String(item?.lead || "").trim();
      if (lead) byLead[lead] = (byLead[lead] || 0) + 1;
      if (item?.telegramId) telegramCount++;
    });
    const leadList = Object.entries(byLead)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { leadList, telegramCount, total: items.length };
  }, [items]);

  return {
    major,
    items,
    loading,
    metaInfo,
    metaLoading,
    resolvedMajor,
    title,
    majorCreatedAtLabel,
    majorCreatedByLabel,
    statistics,
    leadStats,
  };
}
