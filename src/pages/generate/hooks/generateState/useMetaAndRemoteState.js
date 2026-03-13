import { useState, useRef } from "react";

export function useMetaAndRemoteState() {
  // Meta info state
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const telegramGroupNameCacheRef = useRef({});
  const [telegramGroupNameById, setTelegramGroupNameById] = useState({});
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  // Remote mode state
  const [remoteRecord, setRemoteRecord] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");

  return {
    metaInfo,
    setMetaInfo,
    metaLoading,
    setMetaLoading,
    telegramGroupNameCacheRef,
    telegramGroupNameById,
    setTelegramGroupNameById,
    resolvedMajor,
    setResolvedMajor,
    remoteRecord,
    setRemoteRecord,
    remoteLoading,
    setRemoteLoading,
    restoreBusy,
    setRestoreBusy,
    majors,
    setMajors,
    majorModalOpen,
    setMajorModalOpen,
    majorModalKey,
    setMajorModalKey,
  };
}
