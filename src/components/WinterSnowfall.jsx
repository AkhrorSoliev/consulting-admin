import { useEffect, useMemo, useState } from "react";
import Snowfall from "react-snowfall";
import { getCurrentSeason } from "../utils/seasonalBackground";

function isWinterSeason() {
  const season = getCurrentSeason();
  return season === "winter";
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  );
}

function resolveTheme() {
  if (typeof document === "undefined") return "winter";
  return document.documentElement.getAttribute("data-theme") || "winter";
}

function isSnowfallDisabledRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  // Disable snowfall on DataExchange and Create pages
  return path.includes("/dataExchange/") || path.includes("/create");
}

export default function WinterSnowfall({ theme: themeProp }) {
  const [snowflakeCount, setSnowflakeCount] = useState(55);
  const [theme, setTheme] = useState(() => themeProp ?? resolveTheme());
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  // Listen to route changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to popstate (back/forward navigation)
    window.addEventListener("popstate", handleRouteChange);

    // Listen to pushState/replaceState (programmatic navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleRouteChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const enabled = useMemo(() => {
    // Allow explicit disabling via env var (useful for performance debugging)
    // Set: VITE_SNOWFALL=0
    if (import.meta?.env?.VITE_SNOWFALL === "0") return false;
    if (prefersReducedMotion()) return false;
    if (isSnowfallDisabledRoute()) return false;
    return isWinterSeason();
  }, [currentPath]);

  // Keep theme synced even when toggled elsewhere (e.g., Navbar in MainLayout)
  useEffect(() => {
    if (themeProp) return; // controlled externally
    if (typeof document === "undefined") return;

    const update = () => setTheme(resolveTheme());
    update();

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-theme") {
          update();
          break;
        }
      }
    });

    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, [themeProp]);

  const isDark = (themeProp ?? theme) === "dracula";

  useEffect(() => {
    if (!enabled) return;

    const mq = window.matchMedia?.("(max-width: 640px)");
    const update = () => {
      const isSmall = mq ? mq.matches : window.innerWidth <= 640;
      // Minimalistic density: fewer flakes on mobile.
      setSnowflakeCount(isSmall ? 32 : 55);
    };

    update();
    mq?.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq?.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Snowfall
      // Light mode: slightly bluish-gray flakes + subtle shadow for contrast
      // Dark mode: classic white flakes
      color={isDark ? "rgba(255,255,255,0.75)" : "rgba(115,135,165,0.55)"}
      snowflakeCount={snowflakeCount}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        // Help visibility across backgrounds without looking heavy
        filter: isDark
          ? "drop-shadow(0 0 2px rgba(255,255,255,0.12))"
          : "drop-shadow(0 1px 1px rgba(0,0,0,0.18))",
        mixBlendMode: isDark ? "screen" : "multiply",
      }}
    />
  );
}
