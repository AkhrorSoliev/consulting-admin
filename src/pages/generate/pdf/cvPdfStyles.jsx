import { Font, StyleSheet, Text, View } from "@react-pdf/renderer";

export function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
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

function escapeRegExp(input) {
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

export function renderPdfStars(rating) {
  if (rating === null || rating === undefined) return null;
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) return null;

  const stars = [];
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Text key={`full-${i}`} style={{ color: "#f59e0b", fontSize: 14, lineHeight: 1 }}>
        ★
      </Text>,
    );
  }

  if (hasHalfStar) {
    stars.push(
      <View
        key="half"
        style={{ width: 14, height: 14, position: "relative", flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1, position: "absolute", left: 0, top: 0 }}>
          ★
        </Text>
        <View style={{ overflow: "hidden", width: 7, height: 14, position: "absolute", left: 0, top: 0 }}>
          <Text style={{ color: "#f59e0b", fontSize: 14, lineHeight: 1 }}>★</Text>
        </View>
      </View>,
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Text key={`empty-${i}`} style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1 }}>
        ★
      </Text>,
    );
  }

  return stars;
}

let interRegistered = false;
export function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"), fontWeight: 400 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"), fontWeight: 700 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBoldItalic.ttf"), fontWeight: 600, fontStyle: "italic" },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-BoldItalic.ttf"), fontWeight: 700, fontStyle: "italic" },
    ],
  });
}

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 44, fontFamily: "Inter", fontSize: 11,
    color: "#0f172a", lineHeight: 1.38, backgroundColor: "#ffffff",
  },
  pageWithFooter: { paddingBottom: 72 },
  watermark: {
    position: "absolute", top: 202, left: 170,
    width: 256, height: 256, opacity: 0.1,
  },
  header: {
    flexDirection: "column", paddingBottom: 18,
    marginBottom: 12, borderBottomWidth: 0,
  },
  commentHeader: {
    flexDirection: "column", paddingBottom: 0,
    marginBottom: 0, borderBottomWidth: 0,
  },
  headerMainRow: { flexDirection: "row", gap: 22 },
  name: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  divider: { height: 2, backgroundColor: "#1f2937", marginTop: 17, marginBottom: 12 },
  photo: {
    width: 128, height: 160, borderWidth: 1,
    borderColor: "#d9dee3", objectFit: "cover", borderRadius: 8,
  },
  infoCard: { padding: 2, gap: 6 },
  infoBlock: { gap: 6, marginTop: 2 },
  label: {
    color: "#334155", marginRight: 12, fontWeight: "bold",
    width: 110, textAlign: "left",
  },
  value: { color: "#0f172a", flex: 1, marginLeft: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  sectionTitle: {
    fontSize: 13, fontWeight: "bold", marginTop: 20, marginBottom: 8,
    textTransform: "uppercase", letterSpacing: 0.6, color: "#0f172a",
    borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 4,
  },
  timelineRow: {
    flexDirection: "row", gap: 10, marginBottom: 10,
    borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: 0,
  },
  timelineDate: {
    width: 140, minWidth: 140, color: "#475569",
    fontWeight: "bold", flexShrink: 0,
  },
  itemTitle: { fontWeight: "bold", color: "#0f172a" },
  italic: { fontStyle: "italic", color: "#475569" },
  bulletRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1, borderColor: "#334155", color: "#0f172a",
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4,
    fontSize: 10, backgroundColor: "#eef2f7",
  },
  badge: {
    backgroundColor: "#1f2937", color: "#f8fafc",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    fontSize: 10, fontWeight: "bold", alignSelf: "flex-start", marginBottom: 6,
  },
  commentIntro: { marginTop: 6, color: "#475569", fontSize: 13, fontWeight: "bold" },
  commentBody: { marginTop: 0, fontSize: 11, color: "#0f172a", lineHeight: 1.5 },
  commentLine: { fontSize: 11, color: "#0f172a", lineHeight: 1.5 },
  commentFooter: { position: "absolute", left: 44, right: 44, bottom: 34, gap: 4 },
  commentDate: { fontSize: 10, color: "#0f172a", textAlign: "right" },
  commentAutoGenerated: { fontSize: 9, color: "#0f172a", textAlign: "center" },
});
