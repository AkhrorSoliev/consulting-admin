import { db, auth } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * Sync user data to Firestore users collection
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<{synced: boolean, created?: boolean, updated?: boolean}>}
 */
export async function syncUserToFirestore(user) {
  if (!user || !user.uid) {
    console.warn("[userSync] No user or uid provided");
    return { synced: false, reason: "no_user" };
  }

  console.log("[userSync] Starting sync for user:", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    hasPhotoURL: Boolean(user.photoURL),
  });

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      // Create new user document
      console.log("[userSync] Creating new user document for:", user.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      console.log("[userSync] ✅ User document created successfully");
      return { synced: true, created: true };
    }

    // Check if data has changed
    const existingData = userSnap.data();
    const hasChanges =
      existingData.email !== userData.email ||
      existingData.displayName !== userData.displayName ||
      existingData.photoURL !== userData.photoURL;

    if (hasChanges) {
      // Update existing user document
      console.log("[userSync] Updating user document with changes:", {
        emailChanged: existingData.email !== userData.email,
        displayNameChanged: existingData.displayName !== userData.displayName,
        photoURLChanged: existingData.photoURL !== userData.photoURL,
      });
      await setDoc(userRef, userData, { merge: true });
      console.log("[userSync] ✅ User document updated successfully");
      return { synced: true, updated: true };
    }

    // No changes, just update lastLogin
    console.log("[userSync] No changes detected, updating lastLogin only");
    await setDoc(
      userRef,
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("[userSync] ✅ LastLogin updated successfully");

    return { synced: true, updated: false };
  } catch (error) {
    console.error("[userSync] ❌ Error syncing user to Firestore:", error);
    console.error("[userSync] Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
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
    console.error("Error getting user from Firestore:", error);
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
      console.log(`[userSync] No user found with email: ${email}`);
      return null;
    }

    // Return first matching user
    const userData = snapshot.docs[0].data();
    console.log(`[userSync] Found user by email:`, {
      email,
      displayName: userData.displayName,
      hasPhotoURL: Boolean(userData.photoURL),
    });

    return userData;
  } catch (error) {
    console.error("[userSync] Error getting user by email:", error);
    return null;
  }
}
