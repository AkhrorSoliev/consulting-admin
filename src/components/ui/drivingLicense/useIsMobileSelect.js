import { useEffect, useState } from "react";

export default function useIsMobileSelect() {
  const get = () => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    // Treat coarse pointers (touch) and small widths as mobile UX.
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 640px)").matches
    );
  };

  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq1 = window.matchMedia("(pointer: coarse)");
    const mq2 = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(get());

    try {
      mq1.addEventListener("change", onChange);
      mq2.addEventListener("change", onChange);
      return () => {
        mq1.removeEventListener("change", onChange);
        mq2.removeEventListener("change", onChange);
      };
    } catch {
      // Safari fallback
      mq1.addListener(onChange);
      mq2.addListener(onChange);
      return () => {
        mq1.removeListener(onChange);
        mq2.removeListener(onChange);
      };
    }
  }, []);

  return isMobile;
}
