import { SafeInline } from "./utils";

const PLACEHOLDER = "";

export function hasValue(v) {
  return String(v || "").trim().length > 0;
}

export function P({ children, className = "" }) {
  return <div className={`mt-2 ${className}`}>{children}</div>;
}

export function FormRow({
  label,
  value,
  omit,
  showColon = true,
  addComma = false,
}) {
  if (omit) return null;
  return (
    <div className="flex mt-1">
      <div className="w-[100px] shrink-0 text-[10pt]">
        {label}
        {addComma ? "," : ""}
        {showColon && !addComma ? ":" : ""}
      </div>
      {hasValue(value) ? (
        <div className="flex-1 min-h-[14pt] pb-0.5">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
      )}
    </div>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <div className={`border border-slate-700 px-2 py-1.5  ${className}`}>
      {children}
    </div>
  );
}

export function FieldWithLabel({ value, label }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div
        className={`flex-1 min-h-[14pt] pb-0.5 ${
          hasValue(value) ? "" : "border-b border-slate-700"
        }`}
      >
        {hasValue(value) ? (
          <SafeInline>{value}</SafeInline>
        ) : (
          <span className="text-[9pt] tracking-[0.15em] text-slate-400">
            {PLACEHOLDER}
          </span>
        )}
      </div>
      {label ? (
        <div className="text-[9pt] italic opacity-70 shrink-0">{label}</div>
      ) : null}
    </div>
  );
}

export function Bullet({ children }) {
  return (
    <div className="flex gap-2 mt-1">
      <span className="shrink-0">•</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );
}
