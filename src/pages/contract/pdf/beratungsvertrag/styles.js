import { StyleSheet } from "@react-pdf/renderer";

export const s = StyleSheet.create({
  page: {
    // Match Word "Normal" margins: 1 inch on all sides = 72pt
    padding: 72,
    fontFamily: "Inter",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  h: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  p: { marginTop: 6 },
  list: { marginTop: 6, marginLeft: 12 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  liDash: { width: 10 },
  bold: { fontWeight: 700 },
  signatureRow: { marginTop: 18 },
  sigTwoCol: { flexDirection: "row", gap: 18, marginTop: 14 },
  sigCol: { flex: 1 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#334155", paddingBottom: 2 },
  sigNote: { fontSize: 9, color: "#475569", marginTop: 4 },
  sigLabel: { fontSize: 10, marginTop: 10 },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    height: 20,
    marginTop: 10,
  },
  sigTopName: { fontSize: 11, fontWeight: 600, marginTop: 14 },
});

// react-pdf uses points, and percentage strings like "78.4%" are NOT reliable for sizing.
// Keep explicit A4 content width so embedded images don't end up tiny.
export const A4_WIDTH_PT = 595;
export const A4_HEIGHT_PT = 842;
export const PAGE_PADDING_PT = 72;
export const CONTENT_WIDTH_PT = A4_WIDTH_PT - PAGE_PADDING_PT * 2; // 451pt
export const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - PAGE_PADDING_PT * 2; // 698pt
export const PASSPORT_BOX_HEIGHT_PT = Math.floor(CONTENT_HEIGHT_PT * 0.5); // ~50% page
