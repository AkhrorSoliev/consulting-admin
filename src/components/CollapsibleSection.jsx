import { useState } from "react";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = "",
  count,
  meta,
}) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const rightLabel =
    meta !== undefined && meta !== null
      ? String(meta)
      : typeof count === "number"
        ? String(count)
        : "";

  return (
    <details
      className={[
        "collapse collapse-arrow bg-base-100 border border-base-300 rounded-box",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="collapse-title text-base font-semibold">
        <div className="flex items-center justify-between gap-3">
          <span>{title}</span>
          {rightLabel ? (
            <span className="badge badge-ghost badge-sm">{rightLabel}</span>
          ) : null}
        </div>
      </summary>
      <div className="collapse-content pt-0">{children}</div>
    </details>
  );
}


