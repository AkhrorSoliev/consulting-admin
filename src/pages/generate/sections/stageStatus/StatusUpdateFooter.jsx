export default function StatusUpdateFooter({ statusUpdatedAt, statusUpdatedBy }) {
  const formattedDate = statusUpdatedAt
    ? (() => {
        try {
          const d = new Date(statusUpdatedAt);
          if (Number.isNaN(d.getTime())) return "\u2014";
          return new Intl.DateTimeFormat("uz-UZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Tashkent",
          }).format(d);
        } catch {
          return "\u2014";
        }
      })()
    : "\u2014";

  return (
    <div className="mt-3 p-3 bg-base-200 rounded-lg border border-base-300">
      <div className="text-sm font-medium text-base-content opacity-80">
        Letzte Aktualisierung:{" "}
        <span className="font-normal">{formattedDate}</span>
        {statusUpdatedBy ? (
          <span className="font-normal">
            {" \u2022 Von: "}
            <span className="text-primary">{statusUpdatedBy}</span>
          </span>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
