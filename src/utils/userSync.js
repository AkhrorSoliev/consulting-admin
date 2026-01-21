import { db, auth } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * Sync user data to Firestore users collection
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<{synced: boolean, created?: boolean, updated?: boolean}>}
 */
export async function syncUserToFirestore(user) {
  if (!user || !user.uid) {
    return { synced: false, reason: "no_user" };
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const displayName = user.displayName || "";
    const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName || user.email || "User")}`;
    const avatarUrl = user.photoURL || defaultAvatar;

    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: displayName,
      photoURL: user.photoURL || "",
      avatar: avatarUrl,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      return { synced: true, created: true };
    }

    // Check if data has changed
    const existingData = userSnap.data();
    const hasChanges =
      existingData.email !== userData.email ||
      existingData.displayName !== userData.displayName ||
      existingData.photoURL !== userData.photoURL ||
      existingData.avatar !== userData.avatar;

    if (hasChanges) {
      // Update existing user document
      await setDoc(userRef, userData, { merge: true });
      return { synced: true, updated: true };
    }

    // No changes, just update lastLogin
    await setDoc(
      userRef,
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    return { synced: true, updated: false };
  } catch (error) {
    return { synced: false, error: error.message };
  }
}

/**
 * Get user data from Firestore users collection
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>}
 */
export async function getUserFromFirestore(uid) {
  if (!uid) return null;

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user by UID with fallback to current auth user
 * @param {string} uid - Optional user ID
 * @returns {Promise<Object|null>}
 */
export async function getUserData(uid = null) {
  const targetUid = uid || auth.currentUser?.uid;
  if (!targetUid) return null;

  return getUserFromFirestore(targetUid);
}

/**
 * Get user by email from Firestore users collection
 * @param {string} email - User email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  if (!email) return null;

  try {
    const { collection, query, where, getDocs } = await import(
      "firebase/firestore"
    );

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Return first matching user
    const userData = snapshot.docs[0].data();
    return userData;
  } catch (error) {
    return null;
  }
}
