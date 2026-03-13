export default function FormSection({
  title,
  colorClass = "bg-primary",
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 gap-4",
  children,
}) {
  return (
    <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
        <span className={`w-1 h-4 ${colorClass} rounded-full`}></span>
        {title}
      </h3>
      <div className={gridClassName}>{children}</div>
    </div>
  );
}
