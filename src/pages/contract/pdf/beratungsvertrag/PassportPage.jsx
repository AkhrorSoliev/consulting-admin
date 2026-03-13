import { Image, Page, Text, View } from "@react-pdf/renderer";
import { s, CONTENT_WIDTH_PT, PASSPORT_BOX_HEIGHT_PT } from "./styles";

export default function PassportPage({ passportSrc, candidateCity, pdfGeneratedDate, nameLine }) {
  if (!passportSrc) return null;

  return (
    // Keep this as a single page (never wrap to an extra page).
    <Page size="A4" style={s.page} wrap={false}>
      {/* Start from top of the content area (not centered / bottom-aligned) */}
      <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }}>
        {/* Use explicit content width (points) so the image fills the page correctly */}
        <View style={{ width: CONTENT_WIDTH_PT }}>
          {/* Rotate image -90deg: swap width/height and use transform */}
          <View
            style={{
              width: CONTENT_WIDTH_PT,
              height: PASSPORT_BOX_HEIGHT_PT,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <Image
              src={passportSrc}
              style={{
                width: PASSPORT_BOX_HEIGHT_PT,
                height: CONTENT_WIDTH_PT,
                objectFit: "contain",
                backgroundColor: "#ffffff",
                transform: "rotate(-90deg)",
              }}
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontWeight: 600 }}>
              Datum: {candidateCity ? `${candidateCity}, ` : ""}{pdfGeneratedDate}
            </Text>
            <Text style={{ fontWeight: 600, marginTop: 8 }}>
              Name: {nameLine}
            </Text>
            <Text style={{ fontWeight: 600, marginTop: 18 }}>
              Unterschrift:
            </Text>
            <View style={{ borderBottomWidth: 1, borderBottomColor: "#334155", height: 20, marginTop: 10 }} />
          </View>
        </View>
      </View>
    </Page>
  );
}
