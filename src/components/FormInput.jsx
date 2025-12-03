function FormInput({
  placeholder = "Type here",
  className = "",
  name = "",
  ...props
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={`input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 ${className}`}
      name={name}
      {...props}
    />
  );
}

export default FormInput;
