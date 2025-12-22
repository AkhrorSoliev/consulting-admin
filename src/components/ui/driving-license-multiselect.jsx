import { useEffect, useMemo, useRef, useState } from "react";

function useIsMobileSelect() {
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

export default function DrivingLicenseMultiSelect({
  id,
  label = "Führerschein-Klassen (mehrere möglich)",
  options = [],
  value,
  onChange,
  error,
  placeholder = "Bitte auswählen",
}) {
  const isMobile = useIsMobileSelect();

  const selected = useMemo(() => {
    const arr = Array.isArray(value)
      ? value
      : String(value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    return arr
      .map((s) => String(s || "").trim().toUpperCase())
      .filter(Boolean);
  }, [value]);

  const displayValue = selected.length ? selected.join(", ") : placeholder;

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const mobileCloseBtnRef = useRef(null);

  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isOpen = isMobile ? isMobileOpen : isDesktopOpen;

  function open() {
    if (isMobile) {
      setIsMobileOpen(true);
      return;
    }
    setIsDesktopOpen(true);
  }

  function close({ restoreFocus = true } = {}) {
    if (isMobile) {
      setIsMobileOpen(false);
    } else {
      setIsDesktopOpen(false);
    }
    if (restoreFocus) {
      queueMicrotask(() => triggerRef.current?.focus?.());
    }
  }

  function toggleOption(opt) {
    const normalized = String(opt || "").trim().toUpperCase();
    if (!normalized) return;
    const set = new Set(selected);
    if (set.has(normalized)) set.delete(normalized);
    else set.add(normalized);
    onChange?.(Array.from(set));
  }

  // Desktop: close on outside click
  useEffect(() => {
    if (isMobile) return;
    if (!isDesktopOpen) return;
    function onPointerDown(e) {
      const root = popoverRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setIsDesktopOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [isDesktopOpen, isMobile]);

  // Desktop: close on ESC
  useEffect(() => {
    if (isMobile) return;
    if (!isDesktopOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktopOpen, isMobile]);

  // Mobile: focus close button when opening (keep “close only via X / Fertig”)
  useEffect(() => {
    if (!isMobile) return;
    if (!isMobileOpen) return;
    const t = setTimeout(() => mobileCloseBtnRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [isMobile, isMobileOpen]);

  return (
    <div ref={popoverRef} className="w-full">
      {label ? (
        <label className="label" htmlFor={id}>
          <span className="label-text">{label}</span>
        </label>
      ) : null}

      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`select select-bordered w-full flex items-center justify-between gap-3 ${
          error ? "select-error" : ""
        }`}
        aria-invalid={error ? "true" : "false"}
        aria-haspopup={isMobile ? "dialog" : "listbox"}
        aria-expanded={isOpen}
        onClick={() => {
          if (isMobile) setIsMobileOpen(true);
          else setIsDesktopOpen((p) => !p);
        }}
      >
        <span
          className={
            selected.length ? "text-base-content" : "text-base-content/60"
          }
        >
          {displayValue}
        </span>
        <span className="text-base-content/60">▾</span>
      </button>

      {/* Desktop popover */}
      {!isMobile && isDesktopOpen ? (
        <ul
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-1 max-h-72 overflow-auto z-60"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((opt) => {
            const upper = String(opt || "").trim().toUpperCase();
            const isSelected = selected.includes(upper);
            return (
              <li key={opt}>
                <button
                  type="button"
                  className="flex items-center gap-2 min-h-11"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    toggleOption(opt);
                    // Keep existing desktop behavior: close after each pick.
                    setIsDesktopOpen(false);
                    queueMicrotask(() => triggerRef.current?.focus?.());
                  }}
                >
                  <span className="w-5 text-center">{isSelected ? "✓" : ""}</span>
                  <span className="font-medium">{upper}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Mobile bottom sheet (no outside click close, no auto-close on selection) */}
      {isMobile && isMobileOpen ? (
        <div
          className="fixed inset-0 z-[999] bg-base-content/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Führerschein-Klassen"
        >
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-base-100 rounded-t-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
              <div className="text-base font-semibold">Führerschein-Klassen</div>
              <button
                ref={mobileCloseBtnRef}
                type="button"
                className="btn btn-ghost btn-square min-h-11 h-11 w-11"
                aria-label="Schließen"
                onClick={() => close()}
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-3 overflow-auto overscroll-contain">
              <div className="space-y-2">
                {options.map((opt) => {
                  const upper = String(opt || "").trim().toUpperCase();
                  const checked = selected.includes(upper);
                  return (
                    <label
                      key={opt}
                      className="flex items-center justify-between gap-3 rounded-xl border border-base-200 px-4 min-h-11 py-3 cursor-pointer select-none"
                    >
                      <span className="font-medium">{upper}</span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={checked}
                        onChange={() => toggleOption(opt)}
                        aria-label={`${upper} auswählen`}
                      />
                    </label>
                  );
                })}
              </div>
              {error ? (
                <p className="text-error text-sm mt-3">{error}</p>
              ) : null}
            </div>

            <div className="sticky bottom-0 bg-base-100 border-t border-base-200 p-4">
              <button
                type="button"
                className="btn btn-primary w-full min-h-11"
                onClick={() => close()}
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error && !isMobile ? (
        <p className="text-error text-sm mt-1">{error}</p>
      ) : null}
    </div>
  );
}


