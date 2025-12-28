import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  count,
  meta,
  className = "",
  contentClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`collapse ${
        isOpen ? "collapse-open" : ""
      } bg-base-100 shadow border border-base-200 ${className}`}
    >
      <input
        type="checkbox"
        checked={isOpen}
        onChange={(e) => setIsOpen(e.target.checked)}
        className="min-h-0"
      />
      <div className="collapse-title text-lg font-semibold flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {title}
          {count !== undefined && (
            <span className="badge badge-primary badge-sm">{count}</span>
          )}
          {meta && <span className="text-sm text-base-content/60">{meta}</span>}
        </div>
        <div className="text-base-content/60">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      <div className={`collapse-content ${contentClassName || "p-4 pt-0"}`}>
        {children}
      </div>
    </div>
  );
}
