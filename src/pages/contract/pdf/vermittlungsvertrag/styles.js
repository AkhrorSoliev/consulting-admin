import { Font, StyleSheet } from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
export function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;
  Font.register({
    family: "Inter",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

export const s = StyleSheet.create({
  page: {
    padding: 72,
    paddingTop: 55,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  p: { marginTop: 6 },
  bold: { fontWeight: 700 },
  h: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  list: { marginTop: 6, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  liDash: { width: 10 },
  sigRow: { marginTop: 18 },
  sigTwoCol: { flexDirection: "row", gap: 18, marginTop: 14 },
  sigCol: { flex: 1 },
  sigLabel: { fontSize: 10, marginTop: 2 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
  },
  sigTopName: { fontSize: 11, fontWeight: 700, marginTop: 4 },
});

// Section title style (dark blue, bold)
export const sectionTitle = {
  fontSize: 11,
  fontWeight: 700,
  marginTop: 14,
  color: "#0f172a",
};

// Red bold for penalty amounts
export const redBold = { fontWeight: 700, color: "#000000" };

export function safeDate(d) {
  const v = String(d || "").trim();
  return v || "____.__.____";
}

export function safeName(n) {
  const v = String(n || "").trim();
  return v || "_____________________";
}
