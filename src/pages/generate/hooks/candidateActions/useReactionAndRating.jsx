import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import toast from "react-hot-toast";
import { normalizeRating } from "../../utils/ratingUtils";

/**
 * Sub-hook for candidate reaction (thumbs up/down) and rating logic.
 */
export function useReactionAndRating({
  id,
  resolvedMajor,
  user,
  userRole,
  reaction,
  setReaction,
  rating,
  setRating,
}) {
  const isSuperAdmin = userRole === "super_admin";
  const canRate = userRole === "admin" || userRole === "super_admin";

  // ── Reaction (thumbs up / down) ───────────────────────────────────

  async function handleReaction(reactionType) {
    if (!isSuperAdmin) {
      toast.error("Faqat super_admin reaktsiya qo'ya oladi.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    try {
      const candidateRef = doc(db, col, docId);
      const newReaction = reaction === reactionType ? null : reactionType;

      await updateDoc(candidateRef, {
        reaction: newReaction,
        reactionUpdatedAt: Date.now(),
      });

      setReaction(newReaction);

      toast.success(
        newReaction === "like"
          ? "\ud83d\udc4d Gef\u00e4llt mir"
          : newReaction === "dislike"
            ? "\ud83d\udc4e Gef\u00e4llt mir nicht"
            : "Reaktion entfernt",
      );
    } catch (err) {
      toast.error("Fehler beim Speichern der Reaktion.");
    }
  }

  // ── Rating ────────────────────────────────────────────────────────

  async function handleRatingChange(nextRating) {
    if (!canRate) {
      toast.error("Faqat admin/super_admin rating qo'ya oladi.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const normalizedNextRating = normalizeRating(nextRating);

    try {
      const candidateRef = doc(db, col, docId);
      await updateDoc(candidateRef, {
        rating: normalizedNextRating,
        ratingUpdatedAt: Date.now(),
        ratingUpdatedBy: user?.email || user?.uid || "admin",
      });
      setRating(normalizedNextRating);

      if (normalizedNextRating === null) {
        toast.success("Bewertung entfernt");
      }
    } catch {
      toast.error("Fehler beim Speichern der Bewertung.");
    }
  }

  function handleRatingReset() {
    handleRatingChange(null);
  }

  return {
    handleReaction,
    handleRatingChange,
    handleRatingReset,
  };
}
