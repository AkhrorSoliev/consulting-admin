export function getAccentClass(tone) {
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

export function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "—";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function getSafePhoto(photo) {
  const p = String(photo || "").trim();
  if (!p) return "";
  if (p === "null" || p === "undefined") return "";
  return p;
}

export function shouldIgnoreCardClick(e, cardRef) {
  try {
    if (!e) return false;
    if (e.defaultPrevented) return true;
    const target = e.target;
    if (!target || typeof target.closest !== "function") return false;
    const interactiveSelector =
      "button, a, input, textarea, select, option, label, [role='button'], [data-no-card-click]";
    const found = target.closest(interactiveSelector);
    if (found && cardRef.current && found === cardRef.current) return false;
    return Boolean(found);
  } catch {
    return false;
  }
}
