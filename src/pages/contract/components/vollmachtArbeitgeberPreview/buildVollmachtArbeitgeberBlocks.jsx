import { hasValue } from "./BlockPrimitives";
import { buildTableBlocks } from "./buildBlocksTable";
import { buildContentBlocks } from "./buildBlocksContent";

function buildAddressLine(street, house, plz, city) {
  let line = "";
  if (street) line += street;
  if (house) line += (line ? ". " : "") + house;
  if (plz) line += (line ? ", " : "") + plz;
  if (city) line += (plz ? "  " : line ? " " : "") + city;
  return line;
}

export function buildVollmachtArbeitgeberBlocks(form) {
  const getOmitKey = (fieldKey) =>
    fieldKey
      ? `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`
      : "";
  const isOmitted = (fieldKey) => Boolean(form?.[getOmitKey(fieldKey)]);

  const buildRepAddressLine = () =>
    buildAddressLine(
      String(form?.employerRepStreet || "").trim(),
      String(form?.employerRepHouseNumber || "").trim(),
      String(form?.employerRepPostalCode || "").trim(),
      String(form?.employerRepCity || "").trim(),
    );

  const buildEmployerAddressLine = () =>
    buildAddressLine(
      String(form?.employerStreet || "").trim(),
      String(form?.employerHouseNumber || "").trim(),
      String(form?.employerPostalCode || "").trim(),
      String(form?.employerCity || "").trim(),
    );

  const employerDisplayName = (() => {
    const designation = form?.employerDesignation;
    if (hasValue(designation)) return designation;
    const companyName = form?.employerCompanyName;
    if (hasValue(companyName)) return companyName;
    return "";
  })();

  const employerRepDisplayName = (() => {
    const full = form?.employerRepFullName;
    if (hasValue(full)) return full;
    const parts = [form?.employerRepFirstName, form?.employerRepLastName]
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return parts.join(" ");
  })();

  const tableBlocks = buildTableBlocks({
    form, isOmitted, buildRepAddressLine, buildEmployerAddressLine,
  });

  const contentBlocks = buildContentBlocks({
    form, isOmitted, employerDisplayName, employerRepDisplayName,
  });

  return [...tableBlocks, ...contentBlocks];
}
