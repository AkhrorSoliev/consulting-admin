import { StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.15,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
  },
  titleDe: {
    textDecoration: "underline",
  },
  titleUz: {
    textDecoration: "underline",
    color: "#1e40af",
  },
  headerField: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerLabel: {
    fontWeight: 600,
    width: 140,
  },
  headerValue: {
    flex: 1,
    minHeight: 14,
  },
  headerValueEmpty: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 4,
    textAlign: "justify",
  },
  listItem: {
    marginBottom: 2,
    paddingLeft: 16,
  },
  bullet: {
    position: "absolute",
    left: 0,
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  signatureLabel: {
    fontWeight: 600,
    width: 220,
  },
  signatureLine: {
    flex: 1,
    minHeight: 14,
  },
  signatureLineEmpty: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 14,
  },
  link: {
    color: "#2563eb",
    textDecoration: "underline",
  },
  bold: {
    fontWeight: 700,
  },
});

export default s;
