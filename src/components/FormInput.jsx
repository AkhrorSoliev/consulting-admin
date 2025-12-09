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
    <div className={`form-control w-full ${className}`}>
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
        className={`input input-bordered w-full ${inputClassName}`}
        name={name}
        {...props}
      />
    </div>
  );
});

export default FormInput;
