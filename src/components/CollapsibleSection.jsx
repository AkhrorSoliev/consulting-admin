import { useState } from "react";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  count,
  meta,
  className = "",
  contentClassName = "",
  isOpen,
  onToggle,
  openClassName = "",
}) {
  const isControlled = typeof isOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? isOpen : internalOpen;

  const handleToggle = (next) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <div
      className={`collapse collapse-arrow bg-base-100 border border-base-200 shadow ${
        open ? "collapse-open" : ""
      } ${open ? openClassName : ""} ${className}`}
    >
      <input
        type="checkbox"
        checked={open}
        onChange={(e) => handleToggle(e.target.checked)}
        className="min-h-0"
      />
      <div className="collapse-title text-lg font-semibold flex items-center gap-3 p-4">
        <span>{title}</span>
        {count !== undefined && (
          <span className="badge badge-primary badge-sm">{count}</span>
        )}
        {meta && <span className="text-sm text-base-content/60">{meta}</span>}
      </div>
      <div className={`collapse-content ${contentClassName || "p-4 pt-0"}`}>
        {children}
      </div>
    </div>
  );
}
