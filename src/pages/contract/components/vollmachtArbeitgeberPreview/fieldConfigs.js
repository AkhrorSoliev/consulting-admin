export const candidateFieldConfigs = [
  { key: "candidateFirstName" },
  { key: "candidateLastName" },
  { key: "candidateBirthDate" },
  { key: "candidateBirthPlace" },
  { key: "candidateBirthCountry" },
  { key: "candidateStreet" },
  { key: "candidateHouseNumber" },
  { key: "candidatePostalCode" },
  { key: "candidateCity" },
  { key: "candidateCountry" },
  { key: "candidatePhone" },
  { key: "candidateEmail" },
];

export const candidateFieldGroups = [
  {
    keys: ["candidateFirstName", "candidateLastName"],
    separator: " ",
  },
  {
    keys: [
      "candidateBirthDate",
      "candidateBirthPlace",
      "candidateBirthCountry",
    ],
    separator: ", ",
  },
  {
    keys: ["candidateStreet", "candidateHouseNumber"],
    separator: " ",
  },
  {
    keys: ["candidatePostalCode", "candidateCity"],
    separator: " ",
  },
  {
    keys: ["candidatePhone"],
    separator: "",
  },
  {
    keys: ["candidateEmail"],
    separator: "",
  },
];

export const employerFieldKeys = [
  "employerCompanyName",
  "employerStreet",
  "employerHouseNumber",
  "employerPostalCode",
  "employerCity",
  "employerCountry",
  "employerRepFirstName",
  "employerRepLastName",
  "employerRepStreet",
  "employerRepHouseNumber",
  "employerRepPostalCode",
  "employerRepCity",
  "employerRepCountry",
  "employerRepPhone",
  "employerRepEmail",
];

export const employerFieldGroups = [
  {
    keys: ["employerCompanyName"],
    separator: "",
  },
  {
    keys: ["employerStreet", "employerHouseNumber"],
    separator: " ",
    useAddressFunction: true,
  },
  {
    keys: ["employerPostalCode", "employerCity"],
    separator: " ",
  },
  {
    keys: ["employerCountry"],
    separator: "",
  },
  {
    keys: ["employerRepFirstName", "employerRepLastName"],
    separator: " ",
  },
  {
    keys: [
      "employerRepStreet",
      "employerRepHouseNumber",
      "employerRepPostalCode",
      "employerRepCity",
    ],
    separator: " ",
  },
  {
    keys: ["employerRepCountry"],
    separator: "",
  },
  {
    keys: ["employerRepPhone"],
    separator: "",
  },
  {
    keys: ["employerRepEmail"],
    separator: "",
  },
];
