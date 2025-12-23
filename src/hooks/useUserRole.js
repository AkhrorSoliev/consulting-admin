import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/**
 * Reads current Firebase custom claims role from the authenticated user.
 * Returns { role, loadingRole } where role is e.g. "admin" | "limited_admin" | null.
 */
export function useUserRole() {
  const { user } = useSelector((state) => state.auth);
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let active = true;
    let didForceRefresh = false;

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
        // First try cached token (cheap). If role is missing, force refresh ONCE.
        let token = await user.getIdTokenResult();
        let nextRole = token?.claims?.role || null;

        if (!nextRole && !didForceRefresh) {
          didForceRefresh = true;
          token = await user.getIdTokenResult(true);
          nextRole = token?.claims?.role || null;
        }

        if (active) setRole(nextRole);
      } catch (err) {
        console.error("Failed to load user role:", err);
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
  }, [user]);

  return { role, loadingRole };
}

export default useUserRole;













