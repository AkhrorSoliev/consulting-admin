/**
 * Renders a group of radio buttons with a label question.
 */
export function RadioGroup({ name, label, options, value, onChange }) {
  return (
    <div className="form-control">
      {label && (
        <label className="label">
          <span className="label-text font-medium whitespace-normal">{label}</span>
        </label>
      )}
      <div className={options.length <= 2 ? "flex gap-4" : "space-y-2"}>
        {options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const optLabel = typeof opt === "string" ? opt : opt.label;
          return (
            <label key={optValue} className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                name={name}
                className={`radio radio-primary${options.length > 6 ? " radio-sm" : ""}`}
                checked={value === optValue}
                onChange={() => onChange(optValue)}
              />
              <span className="label-text whitespace-normal">{optLabel}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders a single checkbox with label text.
 */
export function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="label cursor-pointer justify-start gap-2 items-start">
      <input
        type="checkbox"
        className="checkbox checkbox-primary checkbox-sm mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="label-text text-sm whitespace-normal">{label}</span>
    </label>
  );
}

/**
 * Wraps children in a styled section card.
 */
export function SectionCard({ children }) {
  return (
    <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
      {children}
    </div>
  );
}

/**
 * Section divider with title.
 */
export function SectionDivider({ children }) {
  return (
    <div className="divider divider-start font-bold text-base-content/80">
      {children}
    </div>
  );
}
