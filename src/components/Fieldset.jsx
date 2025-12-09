export default function Fieldset({ children, label }) {
  return (
    <div className="flex relative border px-3 py-5 rounded-sm">
      <h2 className="absolute bg-white top-0 -translate-y-2/4 left-5 font-semibold text-muted-foreground px-2">
        {label}
      </h2>
      {children}
    </div>
  );
}
