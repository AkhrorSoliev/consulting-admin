import { getUserFromFirestore } from "../../../../utils";

/**
 * Builds the comment metadata object when a comment has been updated.
 *
 * @param {Object} params
 * @param {string} commentHtml - Current comment HTML content
 * @param {Object} docCv - The persisted document snapshot
 * @param {Object} user - Firebase auth user
 * @returns {Promise<Object|null>} commentMeta object or null if unchanged
 */
export async function buildCommentMeta({ commentHtml, docCv, user }) {
  const originalComment = String(docCv?.commentar || "");
  const isCommentUpdated =
    String(commentHtml || "") !== String(originalComment || "");

  if (!isCommentUpdated) {
    return null;
  }

  // Fetch user data from Firestore to get displayName and photoURL
  let userData = null;
  if (user?.uid) {
    userData = await getUserFromFirestore(user.uid);
  }

  const displayName =
    userData?.displayName ||
    user?.displayName ||
    user?.email ||
    user?.phoneNumber ||
    "Unbekannt";
  const photoURL =
    userData?.avatar || userData?.photoURL || user?.photoURL || "";

  return {
    updatedAt: Date.now(),
    updatedByUid: user?.uid || "",
    updatedByName: displayName,
    updatedByPhoto: photoURL,
  };
}
