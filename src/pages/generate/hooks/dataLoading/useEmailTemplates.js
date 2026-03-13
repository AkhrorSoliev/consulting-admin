import { useEffect, useState } from "react";
import { subscribeToEmailTemplates } from "../../../../utils/emailTemplates";

/**
 * Subscribes to email templates for privileged users (admin / super_admin).
 */
export function useEmailTemplates({ userRole }) {
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});

  useEffect(() => {
    const isPrivileged = userRole === "super_admin" || userRole === "admin";
    if (!isPrivileged) {
      setEmailTemplatesMap({});
      return undefined;
    }
    const unsub = subscribeToEmailTemplates((map) => {
      setEmailTemplatesMap(map || {});
    });
    return () => unsub?.();
  }, [userRole]);

  return { emailTemplatesMap };
}
