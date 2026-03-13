export default function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-medium wrap-break-word">{value}</div>
    </div>
  );
}
