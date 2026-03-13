import { getInitials, getSafePhoto } from "./cardUtils";

export default function CardBody({ name, photo, meta, lines, emptyLabel, footer }) {
  const initials = getInitials(name);
  const safePhoto = getSafePhoto(photo);

  return (
    <div className="card-body p-4 sm:p-5 flex flex-col h-full gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="avatar shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-base-200/90 ring-1 ring-base-300 flex items-center justify-center">
              {safePhoto ? (
                <img
                  src={safePhoto}
                  alt={name || "Foto"}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              ) : (
                <span className="font-semibold text-base-content/70">
                  {initials}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h2
              className="font-semibold leading-tight truncate"
              title={name || "—"}
            >
              {name || "—"}
            </h2>
            {meta ? (
              <div className="mt-0.5 text-xs text-base-content/60 flex flex-wrap items-center gap-2">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-1 space-y-2 text-sm w-full">
        {Array.isArray(lines) && lines.length > 0 ? (
          lines.map((ln, idx) => {
            if (!ln) return null;
            const { icon, text, title, mono } = ln;
            if (!text) return null;
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                className="flex items-center gap-3 text-base-content/80 overflow-hidden"
              >
                {icon ? (
                  <span className="shrink-0 text-base-content/50 w-4 h-4 inline-flex items-center justify-center">
                    {icon}
                  </span>
                ) : null}
                <span
                  className={[
                    "truncate font-medium",
                    mono ? "font-mono text-xs" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={title || text}
                >
                  {text}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center text-xs text-base-content/40 py-2">
            {emptyLabel}
          </div>
        )}
      </div>

      {footer ? <div className="mt-auto pt-3">{footer}</div> : null}
    </div>
  );
}
