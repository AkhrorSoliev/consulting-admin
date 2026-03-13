import { useState } from "react";
import { buildRestoreFromRemoteMode } from "./restoreFromRemoteMode";
import { buildConfirmRestoreFromModal } from "./confirmRestoreFromModal";

/**
 * Encapsulates remote-restore logic (restore from deleted / archived / remote registry).
 */
export function useRemoteRestore({
  id,
  remoteMode,
  remoteKind,
  remoteRid,
  deletedDocId,
  archivedDocId,
  remoteRecord,
  resolvedMajor,
  setResolvedMajor,
  majors,
  navigate,
  formCv,
  docCv,
  user,
}) {
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");

  const restoreFromRemoteMode = buildRestoreFromRemoteMode({
    remoteMode,
    remoteKind,
    remoteRecord,
    archivedDocId,
    deletedDocId,
    user,
    navigate,
    restoreBusy,
    setRestoreBusy,
    setMajorModalKey,
    setMajorModalOpen,
  });

  const confirmRestoreFromModal = buildConfirmRestoreFromModal({
    remoteKind,
    remoteRecord,
    archivedDocId,
    deletedDocId,
    user,
    navigate,
    majorModalKey,
    setRestoreBusy,
    setMajorModalOpen,
  });

  return {
    restoreFromRemoteMode,
    confirmRestoreFromModal,
    restoreBusy,
    majorModalOpen,
    setMajorModalOpen,
    majorModalKey,
    setMajorModalKey,
  };
}
