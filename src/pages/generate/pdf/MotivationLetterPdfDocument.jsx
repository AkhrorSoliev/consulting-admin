import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
function ensureInterRegistered() {
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
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  });
}

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 62,
    fontFamily: "Inter",
    fontSize: 10.2,
    lineHeight: 1.4,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  heading: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 14,
  },
  placeDate: {
    textAlign: "right",
    marginBottom: 16,
  },
  subject: {
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 12,
  },
  salutation: {
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: "justify",
  },
  closing: {
    marginTop: 12,
    marginBottom: 18,
  },
  signatureName: {
    fontWeight: 600,
  },
  meta: {
    marginBottom: 14,
  },
});

function formatDate(dateValue) {
  const raw = String(dateValue || "").trim();
  if (raw) return raw;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function splitParagraphs(letterText) {
  return String(letterText || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 9);
}

export default function MotivationLetterPdfDocument({
  fullName,
  city,
  date,
  letterText,
}) {
  ensureInterRegistered();

  const safeFullName = String(fullName || "").trim() || "Bewerber/in";
  const safeCity = String(city || "").trim() || "Ort";
  const safeDate = formatDate(date);
  const paragraphs = splitParagraphs(letterText);

  const salutationFromContent = paragraphs[0]?.toLowerCase().startsWith("sehr geehrte")
    ? paragraphs.shift()
    : "Sehr geehrte Damen und Herren,";

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        <Text style={s.placeDate}>{`${safeCity}, ${safeDate}`}</Text>

        <View style={s.meta}>
          <Text style={s.subject}>Betreff: Motivationsschreiben zum Visumantrag</Text>
        </View>

        <Text style={s.salutation}>{salutationFromContent}</Text>

        {paragraphs.map((paragraph, index) => (
          <Text key={`${index}-${paragraph.slice(0, 20)}`} style={s.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={s.closing}>Mit freundlichen Gruessen</Text>
        <Text style={s.signatureName}>{safeFullName}</Text>
      </Page>
    </Document>
  );
}
