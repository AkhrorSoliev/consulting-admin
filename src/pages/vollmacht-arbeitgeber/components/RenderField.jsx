import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";
import { getOmitKey } from "../utils/formHelpers";

export default function RenderField({
  fieldKey,
  label,
  placeholder,
  helperText,
  type = "text",
  allowOmit = true,
  form,
  onFieldChange,
  onOmitToggle,
}) {
  const omitKey = getOmitKey(fieldKey);
  const omitted = allowOmit ? Boolean(form[omitKey]) : false;
  const toggleControl = allowOmit ? (
    <label className="inline-flex items-center gap-2 whitespace-nowrap">
      <input
        type="checkbox"
        className="checkbox checkbox-xs"
        checked={omitted}
        onChange={(e) => onOmitToggle(fieldKey, e.target.checked)}
      />
      <span>Ma'lumot yo'q</span>
    </label>
  ) : null;

  let helperContent = helperText ?? null;
  if (allowOmit) {
    helperContent = helperText ? (
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span>{helperText}</span>
        {toggleControl}
      </span>
    ) : (
      <span className="flex justify-end">{toggleControl}</span>
    );
  }

  const inputValue =
    type === "date" ? toInputDate(String(form[fieldKey] || "")) : form[fieldKey];

  const handleChange = (e) => {
    const raw = e.target.value;
    const nextValue = type === "date" ? fromInputDate(raw) : raw;
    onFieldChange(fieldKey, nextValue);
  };

  return (
    <FormInput
      key={fieldKey}
      label={label}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      helperText={allowOmit ? helperContent : helperText}
      type={type}
      disabled={omitted}
    />
  );
}
