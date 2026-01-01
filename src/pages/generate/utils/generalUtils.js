export function safeJson(value, space = 2, maxLen = 120_000) {
  try {
    const s = JSON.stringify(value, null, space);
    if (typeof s === "string" && s.length > maxLen) {
      return `${s.slice(0, maxLen)}\n... (truncated ${
        s.length - maxLen
      } chars)`;
    }
    return s;
  } catch (e) {
    return `"(unserializable)" ${e?.message || ""}`.trim();
  }
}

export function safeClone(value) {
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {
    // ignore and fallback to JSON clone
  }
  return JSON.parse(JSON.stringify(value ?? null));
}
