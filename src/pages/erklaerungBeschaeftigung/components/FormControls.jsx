export const RadioGroup = ({
  name,
  label,
  options,
  value,
  onChange,
  prefix = "",
}) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text font-medium">{label}</span>
    </label>
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt.value} className="label cursor-pointer gap-2">
          <input
            type="radio"
            name={`${prefix}${name}`}
            className="radio radio-primary"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="label-text">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Bitte wählen...",
}) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text font-medium">{label}</span>
    </label>
    <select
      className="select select-bordered w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export const CheckboxField = ({ label, checked, onChange }) => (
  <label className="label cursor-pointer justify-start gap-3">
    <input
      type="checkbox"
      className="checkbox checkbox-primary"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="label-text">{label}</span>
  </label>
);

export const Section = ({ title, children }) => (
  <>
    <div className="divider divider-start font-bold text-base-content/80">
      {title}
    </div>
    <div className="bg-base-200/50 rounded-lg p-4 space-y-3">{children}</div>
  </>
);
