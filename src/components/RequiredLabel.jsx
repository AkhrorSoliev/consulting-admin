export default function RequiredLabel({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{children}</span>
      <span className="text-error" aria-hidden="true">
        *
      </span>
      <span className="sr-only">Pflichtfeld</span>
    </span>
  );
}

