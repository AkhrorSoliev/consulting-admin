import { useEffect, useState } from "react";
import { getMetaByName } from "../../utils";
import toast from "react-hot-toast";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  toInputDateString,
  resolveLinkType,
  normalizeLeadLinkRow,
} from "../majorsHelpers";

function resolveMajorCollectionName(m) {
  return String(m?.collectionName || m?.slug || m?.name || "").trim();
}

export default function useMajorSettingsState({ open, major, majorKey }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLeads, setIsSavingLeads] = useState(false);
  const [tab, setTab] = useState("link");

  const [internalDate, setInternalDate] = useState("");
  const [internalLink, setInternalLink] = useState("");
  const [internalLinkType, setInternalLinkType] = useState("zoom");
  const [internalLocationName, setInternalLocationName] = useState("");
  const [internalLocationUrl, setInternalLocationUrl] = useState("");

  const [leadershipDate, setLeadershipDate] = useState("");
  const [leadershipLink, setLeadershipLink] = useState("");
  const [leadershipLinkType, setLeadershipLinkType] = useState("zoom");
  const [leadershipLocationName, setLeadershipLocationName] = useState("");
  const [leadershipLocationUrl, setLeadershipLocationUrl] = useState("");

  const [employerDate, setEmployerDate] = useState("");
  const [employerLink, setEmployerLink] = useState("");
  const [employerLinkType, setEmployerLinkType] = useState("zoom");
  const [employerLocationName, setEmployerLocationName] = useState("");
  const [employerLocationUrl, setEmployerLocationUrl] = useState("");

  const [metaName, setMetaName] = useState("");
  const [metaSlug, setMetaSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaValidationError, setMetaValidationError] = useState("");
  const [candidateCount, setCandidateCount] = useState(0);
  const [checkingCandidates, setCheckingCandidates] = useState(false);

  const [leadLinksActive, setLeadLinksActive] = useState(true);
  const [leadLinks, setLeadLinks] = useState([]);
  const [newLeadName, setNewLeadName] = useState("");
  const [deleteLead, setDeleteLead] = useState(null);

  const [tgGroups, setTgGroups] = useState([]);
  const [internalTelegramGroupId, setInternalTelegramGroupId] = useState("");
  const [leadershipTelegramGroupId, setLeadershipTelegramGroupId] =
    useState("");
  const [employerTelegramGroupId, setEmployerTelegramGroupId] = useState("");
  const [inviteCopyLoading, setInviteCopyLoading] = useState({
    internal: false,
    leadership: false,
    employer: false,
  });

  useEffect(() => {
    if (!open || !majorKey) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getMetaByName(majorKey);
        if (cancelled) return;
        setTab("link");
        setInternalDate(toInputDateString(data?.interviewInternal?.date));
        setInternalLink(String(data?.interviewInternal?.link || ""));
        setInternalLinkType(
          resolveLinkType(data?.interviewInternal?.linkType, data?.interviewInternal?.link),
        );
        setInternalLocationName(String(data?.interviewInternal?.locationName || ""));
        setInternalLocationUrl(String(data?.interviewInternal?.locationUrl || ""));
        setLeadershipDate(toInputDateString(data?.interviewLeadership?.date));
        setLeadershipLink(String(data?.interviewLeadership?.link || ""));
        setLeadershipLinkType(
          resolveLinkType(data?.interviewLeadership?.linkType, data?.interviewLeadership?.link),
        );
        setLeadershipLocationName(String(data?.interviewLeadership?.locationName || ""));
        setLeadershipLocationUrl(String(data?.interviewLeadership?.locationUrl || ""));
        setEmployerDate(toInputDateString(data?.interviewEmployer?.date));
        setEmployerLink(String(data?.interviewEmployer?.link || ""));
        setEmployerLinkType(
          resolveLinkType(data?.interviewEmployer?.linkType, data?.interviewEmployer?.link),
        );
        setEmployerLocationName(String(data?.interviewEmployer?.locationName || ""));
        setEmployerLocationUrl(String(data?.interviewEmployer?.locationUrl || ""));
        setInternalTelegramGroupId(String(data?.interviewInternal?.telegramGroupId || "").trim());
        setLeadershipTelegramGroupId(String(data?.interviewLeadership?.telegramGroupId || "").trim());
        setEmployerTelegramGroupId(String(data?.interviewEmployer?.telegramGroupId || "").trim());
        setMetaName(String(data?.name || "").trim());
        setMetaSlug(String(data?.slug || "").trim());
        setMetaTitle(String(data?.title || "").trim());
        setMetaValidationError("");

        setCheckingCandidates(true);
        try {
          const colName = resolveMajorCollectionName(major);
          if (colName) {
            const countSnap = await getCountFromServer(collection(db, colName));
            setCandidateCount(countSnap.data().count || 0);
          } else {
            setCandidateCount(0);
          }
        } catch (e) {
          setCandidateCount(0);
        } finally {
          setCheckingCandidates(false);
        }

        setLeadLinksActive(data?.leadLinksActive !== false);
        const rows = Array.isArray(data?.leadLinks) ? data.leadLinks : [];
        const normalized = rows.map((r, idx) => normalizeLeadLinkRow(r, idx)).filter(Boolean);
        setLeadLinks(normalized);
        setNewLeadName("");
        setDeleteLead(null);

        // Load Telegram groups
        try {
          const tgQ = query(collection(db, "telegram_groups"), where("active", "==", true), limit(200));
          const snap = await getDocs(tgQ);
          setTgGroups(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
        } catch (e) {
          setTgGroups([]);
        }
      } catch (e) {
        if (!cancelled) toast.error("Meta-Daten konnten nicht geladen werden.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, majorKey]);

  return {
    isLoading, isSaving, setIsSaving, isSavingLeads, setIsSavingLeads,
    tab, setTab,
    internalDate, setInternalDate, internalLink, setInternalLink,
    internalLinkType, setInternalLinkType,
    internalLocationName, setInternalLocationName,
    internalLocationUrl, setInternalLocationUrl,
    leadershipDate, setLeadershipDate, leadershipLink, setLeadershipLink,
    leadershipLinkType, setLeadershipLinkType,
    leadershipLocationName, setLeadershipLocationName,
    leadershipLocationUrl, setLeadershipLocationUrl,
    employerDate, setEmployerDate, employerLink, setEmployerLink,
    employerLinkType, setEmployerLinkType,
    employerLocationName, setEmployerLocationName,
    employerLocationUrl, setEmployerLocationUrl,
    metaName, setMetaName, metaSlug, setMetaSlug, metaTitle, setMetaTitle,
    isSavingMeta, setIsSavingMeta,
    metaValidationError, setMetaValidationError,
    candidateCount, checkingCandidates,
    leadLinksActive, setLeadLinksActive,
    leadLinks, setLeadLinks, newLeadName, setNewLeadName,
    deleteLead, setDeleteLead,
    tgGroups,
    internalTelegramGroupId, setInternalTelegramGroupId,
    leadershipTelegramGroupId, setLeadershipTelegramGroupId,
    employerTelegramGroupId, setEmployerTelegramGroupId,
    inviteCopyLoading, setInviteCopyLoading,
  };
}
