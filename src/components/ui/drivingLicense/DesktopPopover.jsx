export default function DesktopPopover({
  options,
  selected,
  toggleOption,
  setIsDesktopOpen,
  triggerRef,
}) {
  return (
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
              <span className="w-5 text-center">{isSelected ? "\u2713" : ""}</span>
              <span className="font-medium">{upper}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
