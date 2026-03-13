import { Text, View, Link as PdfLink } from "@react-pdf/renderer";
import { pdfStyles } from "../cvPdfStyles";

function DocumentGroup({ title, urls }) {
  if (!urls?.length) return null;
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontWeight: "bold", fontSize: 10 }}>{title}</Text>
      {urls.map((url, i) => (
        <View key={i} style={pdfStyles.bulletRow}>
          <Text>{"\u2022"}</Text>
          <PdfLink
            src={url}
            style={{ fontSize: 10, color: "#2563eb", textDecoration: "none" }}
          >
            {url}
          </PdfLink>
        </View>
      ))}
    </View>
  );
}

export default function PdfDocumentsSection({ documents }) {
  const hasPassport = documents?.passport?.length > 0;
  const hasDiplomas = documents?.diplomas?.length > 0;
  const hasCertificates = documents?.certificates?.length > 0;

  if (!hasPassport && !hasDiplomas && !hasCertificates) return null;

  return (
    <>
      <Text style={pdfStyles.sectionTitle}>Dokumente</Text>
      <View style={{ gap: 8 }}>
        <DocumentGroup title="Reisepass" urls={documents.passport} />
        <DocumentGroup title="Diplome" urls={documents.diplomas} />
        <DocumentGroup title="Zertifikate" urls={documents.certificates} />
      </View>
    </>
  );
}
