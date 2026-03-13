import { Document } from "@react-pdf/renderer";
import { ensureInterRegistered, toUzbekText } from "./fotoVideoRozilik/utils";
import GermanPage from "./fotoVideoRozilik/GermanPage";
import UzbekPage from "./fotoVideoRozilik/UzbekPage";

export default function FotoVideoRozilikPdfDocument({ form }) {
  ensureInterRegistered();

  const fullName = String(form?.fullName || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const adresse = String(form?.adresse || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const datum = String(form?.datum || "").trim();
  const email = String(form?.email || "orif.ahmadaliyev@hotmail.de").trim();

  // Uzbek translations
  const adresseUz = toUzbekText(adresse);
  const geburtsortUz = toUzbekText(geburtsort);

  const ortDatum = [geburtsort, datum].filter(Boolean).join(", ");
  const ortDatumUz = [geburtsortUz, datum].filter(Boolean).join(", ");

  return (
    <Document>
      <GermanPage
        fullName={fullName}
        geburtsdatum={geburtsdatum}
        adresse={adresse}
        email={email}
        ortDatum={ortDatum}
      />
      <UzbekPage
        fullName={fullName}
        geburtsdatum={geburtsdatum}
        adresseUz={adresseUz}
        email={email}
        ortDatumUz={ortDatumUz}
      />
    </Document>
  );
}
