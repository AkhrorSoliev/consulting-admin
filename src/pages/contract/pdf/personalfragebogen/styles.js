import { Font, StyleSheet } from "@react-pdf/renderer";

export function getAbsolutePublicUrl(pathname) {
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

const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 30,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.2,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    position: "absolute",
    top: -15,
    right: -20,
    width: 240,
    height: 96,
    objectFit: "contain",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 2,
    color: "#374151",
  },
  subtitleSmall: {
    fontSize: 8,
    color: "#6b7280",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitleSub: {
    fontSize: 8,
    fontWeight: 400,
    color: "#6b7280",
  },
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 14,
  },
  tableCellLabel: {
    width: "40%",
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
  },
  tableCellValue: {
    width: "60%",
    padding: 4,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 9,
    fontWeight: 600,
  },
  labelSubText: {
    fontSize: 6.25,
    color: "#6b7280",
    fontStyle: "italic",
  },
  valueText: {
    fontSize: 9,
  },
  declaration: {
    marginTop: 10,
    fontSize: 8,
    textAlign: "justify",
    lineHeight: 1.3,
  },
  declarationBold: {
    fontWeight: 700,
  },
  declarationItalic: {
    fontStyle: "italic",
    color: "#6b7280",
  },
  signatureSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "40%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 4,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
});

export default s;
