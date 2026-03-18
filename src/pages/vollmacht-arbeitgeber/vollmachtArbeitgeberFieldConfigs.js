export const candidateNameFields = [
  {
    key: "candidateFirstName",
    label: "Vorname",
    placeholder: "z.B. Max",
  },
  {
    key: "candidateLastName",
    label: "Nachname",
    placeholder: "z.B. Mustermann",
  },
];

export const candidateBirthFields = [
  {
    key: "candidateBirthDate",
    label: "Geburtsdatum",
    type: "date",
  },
  {
    key: "candidateBirthPlace",
    label: "Geburtsort",
    placeholder: "z.B. Taschkent",
  },
  {
    key: "candidateBirthCountry",
    label: "Geburtsland",
    placeholder: "z.B. Usbekistan",
  },
];

export const candidateAddressFields = [
  {
    key: "candidateStreet",
    label: "Straße",
    placeholder: "z.B. Musterstraße",
  },
  {
    key: "candidateHouseNumber",
    label: "Hausnummer",
    placeholder: "z.B. 123",
  },
  {
    key: "candidatePostalCode",
    label: "PLZ",
    placeholder: "z.B. 12345",
  },
  {
    key: "candidateCity",
    label: "Ort",
    placeholder: "z.B. Taschkent",
  },
  {
    key: "candidateCountry",
    label: "Land",
    placeholder: "z.B. Usbekistan",
  },
];

export const candidateContactFields = [
  {
    key: "candidatePhone",
    label: "Telefonnummer",
    placeholder: "z.B. +998 90 123 45 67",
  },
  {
    key: "candidateEmail",
    label: "E-Mail",
    placeholder: "z.B. max@example.com",
    type: "email",
  },
];

export const candidateSignatureFields = [
  {
    key: "candidatePlaceDate",
    label: "Ort, Datum (Unterschrift)",
    placeholder: "z.B. Taschkent, 27.12.2025",
  },
];

export const employerBasicFields = [
  {
    key: "employerCompanyName",
    label: "Firmenname (Firma nomi)",
    placeholder: "z.B.: Heinrich Pott GmbH & Co. KG",
  },
  {
    key: "employerStreet",
    label: "Straße (Ko‘cha)",
    placeholder: "z.B.: Bergkirchener Str.",
  },
  {
    key: "employerHouseNumber",
    label: "Hausnummer (Uy raqami)",
    placeholder: "z.B.: 99",
  },
  {
    key: "employerPostalCode",
    label: "PLZ (Pochta indeksi)",
    placeholder: "z.B.: 32429",
  },
  {
    key: "employerCity",
    label: "Ort (Shahar)",
    placeholder: "z.B.: Minden",
  },
  {
    key: "employerCountry",
    label: "Land (Davlat)",
    placeholder: "z.B.: Deutschland",
  },
];

export const employerRepresentativeFields = [
  {
    key: "employerRepFirstName",
    label: "Vorname (Ism)",
    placeholder: "z.B.: Patrick",
  },
  {
    key: "employerRepLastName",
    label: "Nachname (Familiya)",
    placeholder: "z.B.: Pott",
  },
  {
    key: "employerRepStreet",
    label: "Straße (Ko‘cha)",
    placeholder: "z.B.: Musterstraße",
  },
  {
    key: "employerRepHouseNumber",
    label: "Hausnummer (Uy raqami)",
    placeholder: "z.B.: 1",
  },
  {
    key: "employerRepPostalCode",
    label: "PLZ (Pochta indeksi)",
    placeholder: "z.B.: 10115",
  },
  {
    key: "employerRepCity",
    label: "Ort (Shahar)",
    placeholder: "z.B.: Berlin",
  },
  {
    key: "employerRepCountry",
    label: "Land (Davlat)",
    placeholder: "z.B.: Deutschland",
  },
  {
    key: "employerRepPhone",
    label: "Telefonnummer (Vertreter)",
    placeholder: "z.B. +49 30 123456",
  },
  {
    key: "employerRepEmail",
    label: "E-Mail (Vertreter)",
    placeholder: "z.B. schmidt@firma.de",
    type: "email",
  },
];

export const employerSignatureFields = [
  {
    key: "employerPlaceDate",
    label: "Ort, Datum (Unterschrift)",
    placeholder: "z.B. Berlin, 27.12.2025",
  },
];

export const dynamicFields = [
  {
    key: "employerDesignation",
    label: "Bezeichnung des Arbeitgebers",
    placeholder: "z.B. Musterfirma GmbH",
    helperText: 'Wird im Text "Hiermit bevollmächtige ich [...]" verwendet',
  },
  {
    key: "employerRepFullName",
    label: "Name der bevollmächtigten Person",
    placeholder: "z.B. Hans Schmidt",
    helperText: 'Wird im Text "vertreten durch [...]" verwendet',
  },
];
