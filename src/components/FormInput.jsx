import { forwardRef, useId } from "react";

const FormInput = forwardRef(function FormInput(
  {
    placeholder = "Hier eingeben",
    className = "",
    inputClassName = "",
    label = "",
    labelClassName = "label-text",
    helperText = "",
    helperClassName = "",
    rightElement = null,
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
  const helperId = `${safeId}-help`;

  const describedByFromProps = String(props?.["aria-describedby"] || "").trim();
  const describedBy = [
    describedByFromProps,
    helperText ? helperId : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className={`form-control w-full ${className}`}>
      {label ? (
        <label htmlFor={safeId} className="label whitespace-normal">
          <span className={labelClassName}>{label}</span>
        </label>
      ) : null}
      <div className="relative">
        <input
          id={safeId}
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`input input-bordered w-full ${
            rightElement ? "pr-10" : ""
          } ${inputClassName}`}
          name={name}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {rightElement ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        ) : null}
      </div>
      {helperText ? (
        <p
          id={helperId}
          className={`mt-1 text-xs text-base-content/70 ${helperClassName}`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default FormInput;
