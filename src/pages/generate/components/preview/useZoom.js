import { useEffect, useMemo, useRef, useState } from "react";
import { A4_WIDTH_PX } from "./utils";

export default function useZoom({
  pageScale = "auto",
  minScale = 0.5,
  enableClickZoom = false,
  clickZoomMultiplier = 1.5,
}) {
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    moved: false,
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const w =
        entry?.contentRect?.width ?? el.getBoundingClientRect?.().width ?? 0;
      setViewportWidth(Number.isFinite(w) ? w : 0);
    });
    ro.observe(el);
    return () => {
      try {
        ro.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  const minScaleClamped = useMemo(() => {
    const n = Number(minScale);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(0.8, Math.max(0.25, n));
  }, [minScale]);

  const safeScale = useMemo(() => {
    const raw =
      typeof pageScale === "number"
        ? pageScale
        : pageScale === "auto" || pageScale == null
          ? null
          : Number(pageScale);

    if (raw != null && Number.isFinite(raw)) {
      return Math.min(1, Math.max(minScaleClamped, raw));
    }

    const paddingPx = 24;
    const available = Math.max(0, (viewportWidth || 0) - paddingPx);
    if (!available) return 1;
    const auto = available / A4_WIDTH_PX;
    return Math.min(1, Math.max(minScaleClamped, auto));
  }, [pageScale, viewportWidth, minScaleClamped]);

  const MIN_EFFECTIVE_SCALE = minScaleClamped;
  const MAX_EFFECTIVE_SCALE = 2.25;

  const zoomBounds = useMemo(() => {
    const min = Math.max(
      0.5,
      MIN_EFFECTIVE_SCALE / Math.max(0.0001, safeScale),
    );
    const max = Math.min(
      4.5,
      MAX_EFFECTIVE_SCALE / Math.max(0.0001, safeScale),
    );
    return { min, max };
  }, [safeScale, MIN_EFFECTIVE_SCALE, MAX_EFFECTIVE_SCALE]);

  useEffect(() => {
    if (!enableClickZoom) return;
    setZoomFactor((z) => {
      const next = Math.min(zoomBounds.max, Math.max(zoomBounds.min, z));
      return Math.abs(next - 1) < 0.01 ? 1 : next;
    });
  }, [enableClickZoom, zoomBounds.min, zoomBounds.max]);

  const isZoomedIn = enableClickZoom && zoomFactor > 1.001;

  const effectiveScale = useMemo(() => {
    const scaled = safeScale * (enableClickZoom ? zoomFactor : 1);
    return Math.min(MAX_EFFECTIVE_SCALE, Math.max(MIN_EFFECTIVE_SCALE, scaled));
  }, [enableClickZoom, zoomFactor, safeScale, MIN_EFFECTIVE_SCALE, MAX_EFFECTIVE_SCALE]);

  function toggleZoom() {
    if (!enableClickZoom) return;
    if (panStateRef.current?.moved) {
      panStateRef.current.moved = false;
      return;
    }
    setZoomFactor((z) => {
      const next =
        Math.abs(z - 1) < 0.01
          ? Math.max(
              zoomBounds.min,
              Math.min(zoomBounds.max, clickZoomMultiplier),
            )
          : 1;
      return next;
    });
  }

  function setZoomClamped(next) {
    const n = Number(next);
    if (!Number.isFinite(n)) return;
    let clamped = Math.min(zoomBounds.max, Math.max(zoomBounds.min, n));
    if (clamped > 0.94 && clamped < 1.01) {
      clamped = n > zoomFactor ? 1.01 : 0.94;
    }
    setZoomFactor(Math.abs(clamped - 1) < 0.01 ? 1 : clamped);
  }

  return {
    viewportRef,
    panStateRef,
    isPanning,
    setIsPanning,
    zoomFactor,
    zoomBounds,
    isZoomedIn,
    effectiveScale,
    toggleZoom,
    setZoomClamped,
    enableClickZoom,
  };
}
