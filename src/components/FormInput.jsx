import { forwardRef, useId } from "react";

const FormInput = forwardRef(function FormInput(
  {
    placeholder = "Hier eingeben",
    className = "",
    inputClassName = "",
    label = "",
    labelClassName = "label-text",
    id,
    name = "",
    type = "text",
    ...props
  },
  ref
) {
  const reactId = useId();
  const rawId = id || name || reactId;
  const safeId = String(rawId).replace(/[^A-Za-z0-9_-]+/g, "-");

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={safeId} className="label">
          <span className={labelClassName}>{label}</span>
        </label>
      ) : null}
      <input
        id={safeId}
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 ${inputClassName}`}
        name={name}
        {...props}
      />
    </div>
  );
});

export default FormInput;
