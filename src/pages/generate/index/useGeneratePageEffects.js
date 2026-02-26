import { useEffect } from "react";

// Incremental refactor helper for page-level side effects.
// Keeps a dedicated extension point while behavior remains unchanged.
export function useGeneratePageEffects(effect) {
  useEffect(() => {
    if (typeof effect === "function") return effect();
    return undefined;
  }, [effect]);
}
