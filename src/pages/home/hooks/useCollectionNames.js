import { useEffect, useState } from "react";
import { subscribeToCollections } from "../../../utils";

export function useCollectionNames() {
  const [collectionNames, setCollectionNames] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCollections((names) => {
      const activeNames = (names || []).filter((n) => {
        if (typeof n === "string") return true;
        return !n?.isDeleted;
      });
      setCollectionNames(activeNames);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return collectionNames;
}
