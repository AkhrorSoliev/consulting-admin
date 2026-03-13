import { StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Arimo",
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.25,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 10,
    color: "#30849b",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 24,
  },
  p: { marginTop: 0 },
  bold: { fontWeight: 700 },
  table: {
    marginTop: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#334155",
  },
  tableCol: {
    flex: 1,
    borderRightWidth: 1,
  },
  tableColLast: {
    flex: 1,
  },
  tableHeader: {
    padding: 4,
    fontWeight: 700,
    textDecoration: "underline",
  },
  tableHeaderRight: {
    padding: 4,
    fontWeight: 700,
    textAlign: "right",
    textDecoration: "underline",
  },
  tableCell: {
    padding: 5,
  },
  tableCellContent: {
    fontSize: 10,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  fieldValue: {
    flex: 1,
    minHeight: 14,
    justifyContent: "flex-end",
    paddingBottom: 0.5,
  },
  fieldValueUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  placeholderText: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#94a3b8",
  },
  fieldLabel: {
    fontSize: 9,
    fontStyle: "italic",
    opacity: 0.7,
  },
  list: { marginTop: 6, marginLeft: 10 },
  liRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  liDash: { width: 10 },
  formRow: { flexDirection: "row", marginTop: 4 },
  formLabel: { width: "auto", fontSize: 10 },
  formValue: { flex: 1 },
  formUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flex: 1,
    minHeight: 14,
  },
  signatureSection: {
    marginTop: 48,
    flexDirection: "row",
    gap: 28,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 4,
    fontSize: 10,
    textAlign: "center",
  },
});

export default s;
