import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

/**
 * Reads current Firebase custom claims role from the authenticated user.
 * Returns { role, loadingRole } where role is e.g. "admin" | "limited_admin" | null.
 */
export function useUserRole(options = {}) {
  const { user } = useSelector((state) => state.auth);
  const [role, setRole] = useState(null);
  // Important: start in "loading" state when we already have an authenticated user.
  // Otherwise role-gated routes may redirect on the first render before claims are fetched.
  const [loadingRole, setLoadingRole] = useState(Boolean(user));

  const forceRefresh = useMemo(
    () => Boolean(options?.forceRefresh),
    [options?.forceRefresh]
  );

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user) {
        if (active) {
          setRole(null);
          setLoadingRole(false);
        }
        return;
      }

      setLoadingRole(true);
      try {
        const token = await user.getIdTokenResult(forceRefresh);
        if (active) {
          setRole(token?.claims?.role || null);
        }
      } catch (err) {
        if (active) {
          setRole(null);
        }
      } finally {
        if (active) {
          setLoadingRole(false);
        }
      }
    }

    loadRole();
    return () => {
      active = false;
    };
  }, [user, forceRefresh]);

  return { role, loadingRole };
}

export default useUserRole;
