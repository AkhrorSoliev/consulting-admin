import { useEffect, useRef, useState } from "react";
import { getUserByEmail, getUserFromFirestore } from "../../../utils";

export function useUserPhotos(items) {
  const [userPhotosCache, setUserPhotosCache] = useState({});
  const fetchedEmailsRef = useRef(new Set());

  useEffect(() => {
    if (!items || items.length === 0) return;

    const fetchUserPhotos = async () => {
      const uidsToFetch = new Set();
      const emailsToFetch = new Set();

      items.forEach((item) => {
        const commentUid = item.commentUpdatedByUid || "";
        if (commentUid && !fetchedEmailsRef.current.has(commentUid)) {
          uidsToFetch.add(commentUid);
        }

        const emailUid = item.emailLastSentByUid || "";
        if (emailUid && !fetchedEmailsRef.current.has(emailUid)) {
          uidsToFetch.add(emailUid);
        }

        const statusUid = item.statusUpdatedByUid || "";
        if (statusUid && !fetchedEmailsRef.current.has(statusUid)) {
          uidsToFetch.add(statusUid);
        }

        const emailLastSentBy = item.emailLastSentBy || "";
        if (
          emailLastSentBy &&
          emailLastSentBy.includes("@") &&
          !item.emailLastSentByUid &&
          !fetchedEmailsRef.current.has(emailLastSentBy)
        ) {
          emailsToFetch.add(emailLastSentBy);
        }

        const commentUpdatedBy = item.commentUpdatedBy || "";
        if (
          commentUpdatedBy &&
          commentUpdatedBy.includes("@") &&
          !item.commentUpdatedByUid &&
          !fetchedEmailsRef.current.has(commentUpdatedBy)
        ) {
          emailsToFetch.add(commentUpdatedBy);
        }
      });

      if (uidsToFetch.size === 0 && emailsToFetch.size === 0) return;

      const newPhotos = {};

      // Fetch every author in parallel; a serial loop cost one round trip per admin.
      const lookups = [
        ...Array.from(uidsToFetch, (uid) => ({ key: uid, load: () => getUserFromFirestore(uid) })),
        ...Array.from(emailsToFetch, (email) => ({ key: email, load: () => getUserByEmail(email) })),
      ];

      lookups.forEach(({ key }) => fetchedEmailsRef.current.add(key));

      await Promise.all(
        lookups.map(async ({ key, load }) => {
          try {
            const userData = await load();
            if (userData && (userData.avatar || userData.photoURL)) {
              newPhotos[key] = userData.avatar || userData.photoURL;
            }
          } catch (error) {
            console.error(`Failed to fetch user photo for ${key}:`, error);
          }
        }),
      );

      if (Object.keys(newPhotos).length > 0) {
        setUserPhotosCache((prev) => ({ ...prev, ...newPhotos }));
      }
    };

    fetchUserPhotos();
  }, [items]);

  return { userPhotosCache };
}
