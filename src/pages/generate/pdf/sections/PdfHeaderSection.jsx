import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "../cvPdfStyles";

export default function PdfHeaderSection({
  fullName,
  address,
  birthDate,
  birthPlace,
  maritalStatus,
  childrenText,
  phone,
  email,
  photo,
}) {
  return (
    <View style={pdfStyles.header}>
      <Text style={pdfStyles.name}>{fullName}</Text>
      <View style={pdfStyles.divider} />
      <View style={pdfStyles.headerMainRow}>
        <View style={{ flex: 1 }}>
          <View style={[pdfStyles.infoCard, pdfStyles.infoBlock]}>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Name</Text>
              <Text style={pdfStyles.value}>{fullName}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Anschrift</Text>
              <Text style={pdfStyles.value}>{address}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Geburtsdatum</Text>
              <Text style={pdfStyles.value}>{birthDate}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Geburtsort</Text>
              <Text style={pdfStyles.value}>{birthPlace}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Familienstand</Text>
              <Text style={pdfStyles.value}>{maritalStatus}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Kinder</Text>
              <Text style={pdfStyles.value}>{childrenText}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Tel</Text>
              <Text style={pdfStyles.value}>{phone}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>E-Mail</Text>
              <Text style={pdfStyles.value}>{email}</Text>
            </View>
          </View>
        </View>
        <View>
          {photo ? (
            <PdfImage style={pdfStyles.photo} src={photo} />
          ) : (
            <View
              style={[
                pdfStyles.photo,
                { alignItems: "center", justifyContent: "center", color: "#777" },
              ]}
            >
              <Text>Foto</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
