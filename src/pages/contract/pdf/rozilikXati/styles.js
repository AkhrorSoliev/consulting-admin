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
    fontFamily: "Inter",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 20,
    color: "#2563eb",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    fontStyle: "italic",
    marginTop: 16,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  formLabel: {
    width: 140,
  },
  formValue: {
    flex: 1,
  },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    minHeight: 14,
  },
  contentText: {
    marginTop: 12,
    textAlign: "justify",
  },
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBlock: {
    width: "30%",
  },
  signatureUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 1,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: "center",
  },
});

export function hasValue(v) {
  return String(v || "").trim().length > 0;
}
