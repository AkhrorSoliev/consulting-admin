import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  count,
  meta,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-base-100 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-base-200/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {count !== undefined && (
            <span className="badge badge-primary badge-sm">{count}</span>
          )}
          {meta && (
            <span className="text-sm text-base-content/60">{meta}</span>
          )}
        </div>
        <div className="text-base-content/60">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </button>
      
      {isOpen && (
        <div className="border-t border-base-300">
          {children}
        </div>
      )}
    </div>
  );
}
