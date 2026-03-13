export function arePageIndexGroupsEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (!Array.isArray(pa) || !Array.isArray(pb) || pa.length !== pb.length)
      return false;
    for (let j = 0; j < pa.length; j++) {
      if (pa[j] !== pb[j]) return false;
    }
  }
  return true;
}

export function escapeRegExp(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitCommentLabelLine(line) {
  const raw = String(line || "");
  if (!raw.trim()) return null;

  const labels = [
    "Eingeschätzte Sprachniveau",
    "Erfahrung in diesem Bereich",
    "Langfristige Ziele in Deutschland",
    "Auslandserfahrungen",
    "Familie/Kinder",
    "Weitere Gesprächsnotizen",
  ];
  const alt = labels.map(escapeRegExp).join("|");
  const re = new RegExp(
    `^(\\s*(?:\\d+\\.)?\\s*)(${alt})(\\s*:)?(\\s*)(.*)$`,
    "i",
  );
  const m = raw.match(re);
  if (!m) return null;

  const label = m[2] || "";
  const colon = m[3] || "";
  const spacesAfter = m[4] || "";
  const tail = m[5] || "";

  return {
    labelText: `${label}${colon}`,
    tailText: `${spacesAfter}${tail}`,
  };
}

export function softWrapTextLine(line, maxChars = 110) {
  const raw = String(line ?? "");
  if (!raw) return [""];
  if (raw.length <= maxChars) return [raw];

  const chunks = [];
  let current = "";
  const tokens = raw.split(/(\s+)/).filter((t) => t.length > 0);

  const pushCurrent = () => {
    if (current.length > 0) {
      chunks.push(current);
      current = "";
    }
  };

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token);
    if (isSpace) {
      if (!current) continue;
      if ((current + token).length <= maxChars) {
        current += token;
      } else {
        pushCurrent();
      }
      continue;
    }

    if (token.length > maxChars) {
      pushCurrent();
      for (let i = 0; i < token.length; i += maxChars) {
        chunks.push(token.slice(i, i + maxChars));
      }
      continue;
    }

    if (!current) {
      current = token;
      continue;
    }

    if ((current + token).length <= maxChars) {
      current += token;
      continue;
    }

    pushCurrent();
    current = token;
  }

  pushCurrent();
  return chunks.length ? chunks : [raw];
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatDateDDMMYYYY(ms) {
  const n = typeof ms === "number" ? ms : Number(ms);
  if (!Number.isFinite(n)) return "—";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function renderStars(rating) {
  if (rating === null || rating === undefined) return null;
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) return null;

  const stars = [];
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span
        key={`full-${i}`}
        className="text-amber-500 text-[14pt] leading-none"
      >
        ★
      </span>,
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span
        key="half"
        className="relative inline-flex w-[14pt] h-[14pt] leading-none align-middle"
      >
        <span className="absolute inset-0 text-gray-300 text-[14pt] leading-none">
          ★
        </span>
        <span className="absolute inset-0 overflow-hidden w-[7pt]">
          <span className="text-amber-500 text-[14pt] leading-none">★</span>
        </span>
      </span>,
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span
        key={`empty-${i}`}
        className="text-gray-300 text-[14pt] leading-none"
      >
        ★
      </span>,
    );
  }

  return stars;
}

// A4 in points (matching `@react-pdf/renderer` default A4 size)
export const A4_WIDTH_PT = 595;
export const A4_HEIGHT_PT = 842;
export const PT_TO_PX = 96 / 72; // CSS: 1pt = 1/72in, 1in = 96px
export const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
export const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;

export const AUTO_GENERATED_NOTE =
  "Dieser Lebenslauf wurde automatisch vom ConsultingUz erstellt";
