export function formatGermanAddress(parts) {
  const street = String(parts?.street || "").trim();
  const houseNumber = String(parts?.houseNumber || "").trim();
  const postalCode = String(parts?.postalCode || "").trim();
  const city = String(parts?.city || "").trim();
  const country = String(parts?.country || "").trim();

  const streetLine = [street, houseNumber].filter(Boolean).join(" ").trim();
  const cityLine = [postalCode, city].filter(Boolean).join(" ").trim();
  return [streetLine, cityLine, country].filter(Boolean).join(", ").trim();
}

export function parseGermanAddress(raw) {
  const normalized = String(raw || "")
    .replace(/\s*\n+\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "",
    };
  }

  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let streetLine = normalized;
  let postalCode = "";
  let city = "";
  let country = "";

  if (parts.length >= 3) {
    const maybeCountry = parts[parts.length - 1];
    if (maybeCountry && !/\d/.test(maybeCountry)) {
      country = maybeCountry;
      streetLine = parts.slice(0, parts.length - 1).join(", ");
    }
  }

  const mPlz = streetLine.match(/^(.*?)(?:,\s*)?(\d{5,6})\s+(.+)$/);
  if (mPlz) {
    streetLine = String(mPlz[1] || "")
      .trim()
      .replace(/,+\s*$/, "");
    postalCode = String(mPlz[2] || "").trim();
    city = String(mPlz[3] || "").trim();
  }

  let street = streetLine;
  let houseNumber = "";
  const cleanedStreetLine = streetLine.replace(/\.\s*$/, "").trim();
  const mHouse = cleanedStreetLine.match(/^(.+?)\s+([\d]+[\w\-\/]*)$/);
  if (mHouse) {
    street = String(mHouse[1] || "")
      .trim()
      .replace(/\.$/, "");
    houseNumber = String(mHouse[2] || "").trim();
  } else {
    street = cleanedStreetLine;
  }

  return { street, houseNumber, postalCode, city, country };
}

export function isGermanAddressComplete(parts) {
  return (
    Boolean(String(parts?.street || "").trim()) &&
    Boolean(String(parts?.houseNumber || "").trim()) &&
    /^\d{5,6}$/.test(String(parts?.postalCode || "").trim()) &&
    Boolean(String(parts?.city || "").trim()) &&
    Boolean(String(parts?.country || "").trim())
  );
}
