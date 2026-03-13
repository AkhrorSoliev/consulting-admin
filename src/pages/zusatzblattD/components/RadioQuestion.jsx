export default function RadioQuestion({ name, label, hint, value, onChange }) {
  return (
    <div className="form-control">
      <label className="label flex-col items-start gap-1">
        <span className="label-text whitespace-normal font-medium">{label}</span>
        {hint && (
          <span className="label-text whitespace-normal text-xs opacity-70">{hint}</span>
        )}
      </label>
      <div className="flex gap-4">
        {["ja", "nein"].map((opt) => (
          <label key={opt} className="label cursor-pointer gap-2">
            <input
              type="radio"
              name={name}
              className="radio radio-primary"
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="label-text whitespace-nowrap">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
