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
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "left",
    marginBottom: 60,
    marginLeft: "auto",
  },
  headerCompany: {
    fontSize: 11,
    fontWeight: 700,
  },
  headerText: {
    fontSize: 11,
    marginTop: 2,
  },
  headerLink: {
    fontSize: 11,
    color: "#2563eb",
    textDecoration: "none",
  },
  candidateName: {
    marginBottom: 20,
  },
  dateRow: {
    marginBottom: 30,
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 30,
  },
  salutation: {
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 16,
    textAlign: "justify",
  },
  closing: {
    marginTop: 30,
    marginBottom: 50,
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureName: {
    fontWeight: 600,
  },
  signatureRole: {
    color: "#2563eb",
  },
});
