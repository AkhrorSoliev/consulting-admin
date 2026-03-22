import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { getUserFromFirestore } from "../../../../utils";
import {
  CANDIDATE_STATUS_DEFAULT,
  normalizeCandidateStatusValue,
} from "../../../../constants/candidateStatus";
import { normalizeRating } from "../../utils/ratingUtils";

/**
 * Subscribes to the candidate Firestore document via onSnapshot.
 * Handles status, rating, reaction, emailMeta, commentMeta,
 * and initial form mapping.
 */
export function useCandidateSnapshot({
  resolvedMajor,
  id,
  remoteMode,
  setDocCv,
  setLoading,
  setNotFound,
  setFormInitialized,
  formInitializedRef,
  baselineInitializedRef,
  setSavedBaselineJson,
  setFormCv,
  normalizeForm,
  mapDocToForm,
  setRating,
  setReaction,
  setEmailMetaAvatarFromUsers,
  formInitialized,
  DEBUG_GENERATE,
  lateSettersRef,
  previousCityRef,
  previousBirthPlaceRef,
}) {
  useEffect(() => {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (remoteMode) return undefined;
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    // Reset states when navigating to new candidate
    setLoading(true);
    setNotFound(false);
    setDocCv(null);
    setFormInitialized(false);
    formInitializedRef.current = false;
    baselineInitializedRef.current = false;
    previousCityRef.current = "";
    previousBirthPlaceRef.current = "";
    setSavedBaselineJson("");

    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          if (DEBUG_GENERATE) {
            const debugPayload = {
              path: { collection: col, id: docId },
              data,
              meta: {
                hasPendingWrites: Boolean(snap?.metadata?.hasPendingWrites),
                fromCache: Boolean(snap?.metadata?.fromCache),
              },
            };
            try {
              window.__generateCandidateSnapshot = debugPayload;
            } catch {
              // ignore
            }
          }
          const status = data?.status || {};
          lateSettersRef.current.setStatusValue(
            normalizeCandidateStatusValue(
              status?.value || CANDIDATE_STATUS_DEFAULT,
            ) || CANDIDATE_STATUS_DEFAULT,
          );
          lateSettersRef.current.setStatusUpdatedAt(status?.updatedAt || null);
          lateSettersRef.current.setStatusUpdatedBy(status?.updatedBy || "");
          setReaction(data?.reaction || null);
          setRating(normalizeRating(data?.rating));
          setDocCv(data);

          const cMeta = data?.commentarMeta || {};
          lateSettersRef.current.setCommentMeta({
            updatedAt: cMeta?.updatedAt || null,
            updatedByName: cMeta?.updatedByName || "",
            updatedByPhoto: cMeta?.updatedByPhoto || "",
            updatedByUid: cMeta?.updatedByUid || "",
          });

          // Fetch avatar from users collection if comment photo is missing
          if (cMeta?.updatedByUid && !cMeta?.updatedByPhoto) {
            getUserFromFirestore(cMeta.updatedByUid)
              .then((userData) => {
                if (userData && (userData.avatar || userData.photoURL)) {
                  lateSettersRef.current.setCommentMeta((prev) => ({
                    ...prev,
                    updatedByPhoto: userData.avatar || userData.photoURL,
                  }));
                }
              })
              .catch(() => {});
          }

          const eMeta = data?.emailMeta || {};
          lateSettersRef.current.setEmailMeta({
            count: eMeta?.count || 0,
            lastSentAt: eMeta?.lastSentAt || null,
            lastSentBy: eMeta?.lastSentBy || "",
            lastSentByUid: eMeta?.lastSentByUid || "",
            lastSentByName: eMeta?.lastSentByName || "",
            lastSentByPhoto: eMeta?.lastSentByPhoto || "",
            lastSentType: eMeta?.lastSentType || "",
          });

          // Fetch avatar from users collection by UID if photo is missing
          if (eMeta?.lastSentByUid && !eMeta?.lastSentByPhoto) {
            getUserFromFirestore(eMeta.lastSentByUid)
              .then((userData) => {
                if (userData && (userData.avatar || userData.photoURL)) {
                  setEmailMetaAvatarFromUsers(
                    userData.avatar || userData.photoURL,
                  );
                }
              })
              .catch(() => {});
          } else {
            setEmailMetaAvatarFromUsers("");
          }

          setNotFound(false);

          // Only update form on initial load, not on subsequent Firestore updates
          if (!formInitializedRef.current) {
            const mapped = mapDocToForm(data);
            const normalized = normalizeForm(mapped);
            setFormCv(normalized);
            setFormInitialized(true);
            formInitializedRef.current = true;

            // Set baseline immediately after form is initialized
            if (!baselineInitializedRef.current) {
              const baseline = JSON.stringify(normalized);
              setSavedBaselineJson(baseline);
              baselineInitializedRef.current = true;
            }

            // Don't show "success" validation colors on initial load.
            // (phoneTouched / emailTouched are set from the parent component)
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, id]);
}
