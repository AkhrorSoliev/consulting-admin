export function inferLinkType(link, fallback = "zoom") {
  const raw = String(link || "").toLowerCase();
  if (raw.includes("t.me/") || raw.includes("telegram")) return "telegram";
  return fallback;
}

export function createEmptyStageInfo() {
  return {
    dateTime: "",
    link: "",
    linkType: "zoom",
    useGeneratedLink: false,
    locationName: "",
    locationUrl: "",
  };
}

export function getTelegramGroupIdForStage(metaInfo, stageValue) {
  const meta = metaInfo && typeof metaInfo === "object" ? metaInfo : {};
  const internalType = String(
    meta?.interviewInternal?.linkType || ""
  ).toLowerCase();
  const leadershipType = String(
    meta?.interviewLeadership?.linkType || ""
  ).toLowerCase();
  const employerType = String(
    meta?.interviewEmployer?.linkType || ""
  ).toLowerCase();
  const internal =
    internalType === "telegram"
      ? String(meta?.interviewInternal?.telegramGroupId || "").trim()
      : "";
  const leadership =
    leadershipType === "telegram"
      ? String(meta?.interviewLeadership?.telegramGroupId || "").trim()
      : "";
  const employer =
    employerType === "telegram"
      ? String(meta?.interviewEmployer?.telegramGroupId || "").trim()
      : "";
  const stage = String(stageValue || "").trim();
  if (stage === "stage_1") return internal || "";
  if (stage === "stage_2") return leadership || internal || "";
  if (stage === "stage_3" || stage === "stage_4")
    return employer || leadership || internal || "";
  return leadership || internal || employer || "";
}

export function ensureTelegramGroupNameFactory({
  getDocFn,
  docFn,
  dbRef,
  cacheRef,
  setMap,
}) {
  return async function ensureTelegramGroupName(groupDocId) {
    const id = String(groupDocId || "").trim();
    if (!id) return "";
    const cached = cacheRef.current?.[id];
    if (cached) return String(cached || "");
    try {
      const snap = await getDocFn(docFn(dbRef, "telegram_groups", id));
      const data = snap.exists() ? snap.data() || {} : {};
      const name = String(data?.name || "").trim() || id;
      cacheRef.current = { ...(cacheRef.current || {}), [id]: name };
      setMap((prev) => ({ ...(prev || {}), [id]: name }));
      return name;
    } catch {
      const fallback = id;
      cacheRef.current = { ...(cacheRef.current || {}), [id]: fallback };
      setMap((prev) => ({ ...(prev || {}), [id]: fallback }));
      return fallback;
    }
  };
}
