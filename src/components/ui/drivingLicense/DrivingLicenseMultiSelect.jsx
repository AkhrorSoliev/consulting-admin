import { useEffect, useMemo, useRef, useState } from "react";
import useIsMobileSelect from "./useIsMobileSelect";
import DesktopPopover from "./DesktopPopover";
import MobileBottomSheet from "./MobileBottomSheet";

export default function DrivingLicenseMultiSelect({
  id,
  label = "F\u00FChrerschein-Klassen (mehrere m\u00F6glich)",
  options = [],
  value,
  onChange,
  error,
  placeholder = "Bitte ausw\u00E4hlen",
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

  // Mobile: focus close button when opening
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
        <span className="text-base-content/60">{"\u25BE"}</span>
      </button>

      {/* Desktop popover */}
      {!isMobile && isDesktopOpen ? (
        <DesktopPopover
          options={options}
          selected={selected}
          toggleOption={toggleOption}
          setIsDesktopOpen={setIsDesktopOpen}
          triggerRef={triggerRef}
        />
      ) : null}

      {/* Mobile bottom sheet */}
      {isMobile && isMobileOpen ? (
        <MobileBottomSheet
          options={options}
          selected={selected}
          toggleOption={toggleOption}
          close={close}
          mobileCloseBtnRef={mobileCloseBtnRef}
          error={error}
        />
      ) : null}

      {error && !isMobile ? (
        <p className="text-error text-sm mt-1">{error}</p>
      ) : null}
    </div>
  );
}
