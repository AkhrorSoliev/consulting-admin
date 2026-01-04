import PropTypes from "prop-types";
import { useRef, memo } from "react";

function getAccentClass(tone) {
  switch (tone) {
    case "success":
      return "border-l-success";
    case "warning":
      return "border-l-warning";
    case "primary":
      return "border-l-primary";
    case "error":
      return "border-l-error";
    default:
      return "border-l-info";
  }
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "—";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

const CandidateCard = memo(function CandidateCard({
  tone = "info",
  onClick,
  topRight,
  footer,
  busy,
  name,
  photo,
  meta,
  lines,
  emptyLabel = "Keine Daten",
}) {
  const clickable = typeof onClick === "function";
  const cardRef = useRef(null);
  const initials = getInitials(name);
  const accentClass = getAccentClass(tone);
  const safePhoto = (() => {
    const p = String(photo || "").trim();
    if (!p) return "";
    if (p === "null" || p === "undefined") return "";
    return p;
  })();

  const shouldIgnoreCardClick = (e) => {
    try {
      if (!e) return false;
      if (e.defaultPrevented) return true;
      const target = e.target;
      if (!target || typeof target.closest !== "function") return false;
      // If the user clicked an interactive element inside the card, don't trigger card navigation.
      // This prevents "button click navigates as if card was clicked" issues.
      const interactiveSelector =
        "button, a, input, textarea, select, option, label, [role='button'], [data-no-card-click]";
      const found = target.closest(interactiveSelector);
      // If the closest match is the card root itself (role="button"), we should not ignore.
      if (found && cardRef.current && found === cardRef.current) return false;
      return Boolean(found);
    } catch {
      return false;
    }
  };

  return (
    <div
      ref={cardRef}
      className={[
        "card bg-base-100 border border-base-300/60 border-l-4",
        accentClass,
        "shadow-sm hover:shadow-md transition-all duration-150",
        clickable ? "cursor-pointer" : "",
        "h-full flex flex-col relative overflow-hidden",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={
        clickable
          ? (e) => {
              if (busy) return;
              if (shouldIgnoreCardClick(e)) return;
              onClick(e);
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (busy) return;
              if (e.key === "Enter" || e.key === " ") onClick(e);
            }
          : undefined
      }
    >
      {topRight ? (
        <div className="absolute top-2 right-2">{topRight}</div>
      ) : null}

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

      {busy ? (
        <div className="absolute inset-0 bg-base-100/80 backdrop-blur-[1px] grid place-items-center z-20">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : null}
    </div>
  );
});

CandidateCard.propTypes = {
  tone: PropTypes.oneOf(["success", "warning", "primary", "info", "error"]),
  onClick: PropTypes.func,
  topRight: PropTypes.node,
  footer: PropTypes.node,
  busy: PropTypes.bool,
  name: PropTypes.string,
  photo: PropTypes.string,
  meta: PropTypes.node,
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      text: PropTypes.string,
      title: PropTypes.string,
      mono: PropTypes.bool,
    })
  ),
  emptyLabel: PropTypes.string,
};

export default CandidateCard;
