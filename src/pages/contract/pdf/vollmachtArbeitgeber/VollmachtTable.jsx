import { Text, View } from "@react-pdf/renderer";
import s from "./styles";
import {
  hasValue,
  getOmitKey,
  buildRepAddressLine,
  buildEmployerAddressLine,
} from "./utils";
import FieldWithLabel from "./FieldWithLabel";

const candidateFieldGroups = [
  { keys: ["candidateFirstName", "candidateLastName"], separator: " " },
  {
    keys: ["candidateBirthDate", "candidateBirthPlace", "candidateBirthCountry"],
    separator: ", ",
  },
  { keys: ["candidateStreet", "candidateHouseNumber"], separator: " " },
  { keys: ["candidatePostalCode", "candidateCity"], separator: " " },
  { keys: ["candidatePhone"], separator: "" },
  { keys: ["candidateEmail"], separator: "" },
];

const employerFieldGroups = [
  { keys: ["employerCompanyName"], separator: "" },
  {
    keys: ["employerStreet", "employerHouseNumber"],
    separator: " ",
    useAddressFunction: true,
  },
  { keys: ["employerPostalCode", "employerCity"], separator: " " },
  { keys: ["employerCountry"], separator: "" },
  { keys: ["employerRepFirstName", "employerRepLastName"], separator: " " },
  {
    keys: [
      "employerRepStreet",
      "employerRepHouseNumber",
      "employerRepPostalCode",
      "employerRepCity",
    ],
    separator: " ",
  },
  { keys: ["employerRepCountry"], separator: "" },
  { keys: ["employerRepPhone"], separator: "" },
  { keys: ["employerRepEmail"], separator: "" },
];

export default function VollmachtTable({ form }) {
  const isOmitted = (fieldKey) => Boolean(form?.[getOmitKey(fieldKey)]);

  return (
    <View style={s.table}>
      <View style={s.tableCol}>
        <View style={s.tableHeader}>
          <Text>Vollmachtgeber</Text>
        </View>
        <View style={s.tableCell}>
          {candidateFieldGroups.map((group, groupIndex) => {
            const values = group.keys
              .map((key) => form?.[key])
              .filter((v) => hasValue(v));
            const combinedValue = values.join(group.separator);
            return isOmitted(group.keys[0]) ? null : (
              <FieldWithLabel
                key={groupIndex}
                value={combinedValue}
                omit={isOmitted(group.keys[0])}
              />
            );
          })}
        </View>
      </View>

      <View style={s.tableColLast}>
        <View style={s.tableHeaderRight}>
          <Text>Arbeitgeber</Text>
        </View>
        <View style={s.tableCell}>
          {employerFieldGroups.map((group, groupIndex) => {
            const values = group.keys
              .map((key) => form?.[key])
              .filter((v) => hasValue(v));
            const combinedValue =
              group.keys[0] === "employerRepStreet"
                ? buildRepAddressLine(form)
                : group.keys[0] === "employerStreet" &&
                  group.useAddressFunction
                ? buildEmployerAddressLine(form)
                : values.join(group.separator);
            return isOmitted(group.keys[0]) ? null : (
              <FieldWithLabel
                key={groupIndex}
                value={combinedValue}
                omit={isOmitted(group.keys[0])}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
