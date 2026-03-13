import { useState, useRef } from "react";
import { CANDIDATE_STATUS_DEFAULT } from "../../../../constants/candidateStatus";

export function useStatusState() {
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const sendingEmailLockRef = useRef(false);

  return {
    statusValue,
    setStatusValue,
    statusUpdatedAt,
    setStatusUpdatedAt,
    statusUpdatedBy,
    setStatusUpdatedBy,
    isSavingStatus,
    setIsSavingStatus,
    sendingStepValue,
    setSendingStepValue,
    sendingEmailLockRef,
  };
}
