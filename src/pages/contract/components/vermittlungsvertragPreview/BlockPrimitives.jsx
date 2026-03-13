export function SectionTitle({ title }) {
  return (
    <div className="mt-[14pt] font-bold text-[#1a365d]">{title}</div>
  );
}

export function P({ children, className = "" }) {
  return (
    <div className={`mt-[6pt] ${className}`}>{children}</div>
  );
}

export function Bullet({ children }) {
  return (
    <div className="flex gap-[6pt] mt-[3pt]">
      <span className="shrink-0">•</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );
}

export function NumberedItem({ n, children }) {
  return (
    <div className="flex gap-[6pt] mt-[3pt]">
      <span className="shrink-0">{n}.</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );
}
