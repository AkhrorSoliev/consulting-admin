import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  subscribeToCollections,
  updateMetaByName,
  deleteCollectionByName,
} from "../../utils";
import toast from "react-hot-toast";
import { useUserRole } from "../../hooks/useUserRole";
import { buildCreateLink } from "../majorsHelpers";
import { HIDDEN_MAJORS_BY_USER, resolveMajorKey } from "./majorUtils";
import useMajorCounts from "./useMajorCounts";

export default function useMajorsData() {
  const [majors, setMajors] = useState([]);
  const [togglingMajorId, setTogglingMajorId] = useState("");
  const [settingsMajor, setSettingsMajor] = useState(null);
  const [linkCopyModal, setLinkCopyModal] = useState({
    open: false,
    major: null,
  });
  const [deleteMajorModal, setDeleteMajorModal] = useState({
    open: false,
    major: null,
    deleting: false,
  });
  const { user } = useSelector((state) => state.auth);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);

  const hiddenMajorIds = useMemo(() => {
    const uid = user?.uid || "";
    return HIDDEN_MAJORS_BY_USER[uid] || [];
  }, [user?.uid]);

  const filteredMajors = useMemo(() => {
    if (hiddenMajorIds.length === 0) return majors;
    return majors.filter((major) => {
      const majorId = major?.id || major?.uuid || major?.linkId || "";
      return !hiddenMajorIds.includes(majorId);
    });
  }, [majors, hiddenMajorIds]);

  const isSettingsOpen = Boolean(settingsMajor);
  const settingsMajorKey = settingsMajor?.key || "";

  const currentSettingsMajor = useMemo(() => {
    if (!settingsMajorKey) return settingsMajor?.major || null;
    const found = (majors || []).find(
      (m) => resolveMajorKey(m) === settingsMajorKey,
    );
    return found || settingsMajor?.major || null;
  }, [majors, settingsMajorKey, settingsMajor?.major]);

  const handleCopyLink = (major) => {
    if (major?.linkActive === false) {
      toast.error("Create-Link ist derzeit AUS. Bitte zuerst einschalten.");
      return;
    }
    const link = buildCreateLink(major);
    if (!link) {
      toast.error(
        "Link konnte nicht erstellt werden (Berufsfeld nicht erkannt).",
      );
      return;
    }
    setLinkCopyModal({ open: true, major });
  };

  const handleDeleteMajor = async () => {
    const major = deleteMajorModal?.major;
    if (!major) return;
    const key = resolveMajorKey(major);
    if (!key) {
      toast.error("Berufsfeld konnte nicht identifiziert werden.");
      return;
    }
    setDeleteMajorModal((prev) => ({ ...prev, deleting: true }));
    try {
      await deleteCollectionByName(key, { deleteCandidates: true });
      setDeleteMajorModal({ open: false, major: null, deleting: false });
    } catch (e) {
      toast.error("Fehler beim Löschen des Berufsfelds.");
      setDeleteMajorModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleToggleCreateLink = async (major, nextChecked) => {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, dies zu ändern.");
      return;
    }
    const key = resolveMajorKey(major);
    if (!key) {
      toast.error("Berufsfeld konnte nicht identifiziert werden.");
      return;
    }
    setTogglingMajorId(key);
    setMajors((prev) =>
      (prev || []).map((m) => {
        const k = resolveMajorKey(m);
        if (k !== key) return m;
        return { ...(m || {}), linkActive: Boolean(nextChecked) };
      }),
    );
    try {
      await updateMetaByName(key, {
        linkActive: Boolean(nextChecked),
        updatedAt: Date.now(),
      });
      toast.success(nextChecked ? "Create-Link: ON" : "Create-Link: OFF");
    } catch (e) {
      setMajors((prev) =>
        (prev || []).map((m) => {
          const k = resolveMajorKey(m);
          if (k !== key) return m;
          return { ...(m || {}), linkActive: !Boolean(nextChecked) };
        }),
      );
      toast.error("Fehler beim Ändern.");
    } finally {
      setTogglingMajorId("");
    }
  };

  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub();
  }, []);

  const { serverCounts, loadingCounts } = useMajorCounts(majors);

  return {
    filteredMajors,
    serverCounts,
    loadingCounts,
    togglingMajorId,
    settingsMajor,
    setSettingsMajor,
    linkCopyModal,
    setLinkCopyModal,
    deleteMajorModal,
    setDeleteMajorModal,
    isLimitedAdmin,
    isSettingsOpen,
    settingsMajorKey,
    currentSettingsMajor,
    handleCopyLink,
    handleDeleteMajor,
    handleToggleCreateLink,
  };
}
