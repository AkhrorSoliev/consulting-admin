import { useEffect } from "react";
import { getMetaByName } from "../../../utils";

/**
 * Major URL param handling: fetches major info from Firestore,
 * validates lead params, and checks Telegram ID on load.
 */
export default function useMajorSetup({
  searchParams,
  setMajorLoading,
  setIsLinkBlocked,
  setBlockedLinkTitle,
  setLeadValue,
  setMajorInfo,
  setIsTelegramChecking,
  setExistingTelegramMajor,
  setIsTelegramModalOpen,
  checkRegistryLive,
  CHECK_REGISTRY_ENDPOINT,
}) {
  // Major URL param handling (fetch major info from Firestore)
  useEffect(() => {
    const key = String(searchParams.get("major") || "").trim();
    const leadParam = String(searchParams.get("lead") || "").trim();
    let cancelled = false;
    setMajorLoading(true);
    (async () => {
      try {
        setIsLinkBlocked(false);
        setBlockedLinkTitle("");
        setLeadValue(leadParam);
        if (!key) {
          setMajorInfo({
            collectionName: "",
            title: "",
            linkId: "",
            showTitle: false,
          });
          return;
        }
        const meta = await getMetaByName(key);
        if (cancelled) return;
        if (meta) {
          const isActive = meta?.linkActive !== false;
          if (!isActive) {
            setIsLinkBlocked(true);
            setBlockedLinkTitle(
              String(meta?.title || meta?.collectionName || key),
            );
          }

          // Lead validation (optional)
          if (leadParam) {
            const leadsGloballyActive = meta?.leadLinksActive !== false;
            const list = Array.isArray(meta?.leadLinks) ? meta.leadLinks : [];
            const match = list.find((l) => {
              const n = String(l?.name || "").trim();
              const id = String(l?.id || l?.key || "").trim();
              return n === leadParam || id === leadParam;
            });
            const leadActive = match ? match?.active !== false : false;
            if (!leadsGloballyActive) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(
                `Lead linklar vaqtincha o'chirilgan (${
                  meta?.title || meta?.collectionName || key
                })`,
              );
            } else if (!match) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(`Lead topilmadi: ${leadParam}`);
            } else if (!leadActive) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(`Lead link aktiv emas: ${leadParam}`);
            }
          }

          const isUuidMatch = key === (meta.linkId || meta.uuid || meta.id);
          const shouldShowTitle =
            isUuidMatch &&
            Boolean(meta.title) &&
            (meta.linkId || meta.uuid || meta.id) !== meta.collectionName;
          setMajorInfo({
            collectionName:
              meta.collectionName || meta.slug || meta.name || key,
            title: meta.title || meta.collectionName || key,
            linkId: meta.linkId || meta.uuid || meta.id || key,
            showTitle: shouldShowTitle,
          });
        } else {
          setMajorInfo({
            collectionName: key,
            title: key,
            linkId: key,
            showTitle: false,
          });
        }
      } catch {
        if (!cancelled) {
          setMajorInfo({
            collectionName: key,
            title: key,
            linkId: key,
            showTitle: false,
          });
        }
      } finally {
        if (!cancelled) setMajorLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setMajorLoading, setIsLinkBlocked, setBlockedLinkTitle, setLeadValue, setMajorInfo]);

  // Check Telegram ID on page load
  useEffect(() => {
    const teIdParam = String(searchParams.get("teId") || "").trim();
    if (!teIdParam || !CHECK_REGISTRY_ENDPOINT) return;

    let cancelled = false;
    setIsTelegramChecking(true);

    (async () => {
      try {
        const r = await checkRegistryLive({ telegramId: teIdParam });
        if (cancelled) return;

        if (r.ok && r?.json?.telegram?.exists) {
          const major = String(r?.json?.telegram?.major || "Unbekannt");
          setExistingTelegramMajor(major);
          setIsTelegramModalOpen(true);
        }
      } catch (e) {
        // Silently fail - user can still try to submit
      } finally {
        if (!cancelled) setIsTelegramChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, CHECK_REGISTRY_ENDPOINT, setIsTelegramChecking, setExistingTelegramMajor, setIsTelegramModalOpen, checkRegistryLive]);
}
