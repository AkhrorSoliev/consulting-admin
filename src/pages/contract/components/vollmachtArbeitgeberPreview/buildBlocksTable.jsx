import { hasValue, TableCell, FieldWithLabel } from "./BlockPrimitives";
import { candidateFieldGroups, employerFieldGroups } from "./fieldConfigs";

export function buildTableBlocks({ form, isOmitted, buildRepAddressLine, buildEmployerAddressLine }) {
  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[14pt] font-bold text-[#30849b]">
            Vollmacht nach § 81a Abs. 1 AufenthG
          </div>
        </div>
      ),
    },
    {
      id: "table",
      keepWithNext: true,
      node: (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-0">
            <TableCell className="font-bold underline">
              Vollmachtgeber
            </TableCell>
            <TableCell className="font-bold text-right underline">
              Arbeitgeber
            </TableCell>
            <TableCell>
              {candidateFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form[key])
                  .filter((v) => hasValue(v));
                const combinedValue = values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel key={groupIndex} value={combinedValue} />
                );
              })}
            </TableCell>
            <TableCell>
              {employerFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form[key])
                  .filter((v) => hasValue(v));
                const combinedValue =
                  group.keys[0] === "employerRepStreet"
                    ? buildRepAddressLine()
                    : group.keys[0] === "employerStreet" &&
                      group.useAddressFunction
                    ? buildEmployerAddressLine()
                    : values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel key={groupIndex} value={combinedValue} />
                );
              })}
            </TableCell>
          </div>
        </div>
      ),
    },
    {
      id: "title",
      keepWithNext: true,
      node: (
        <div className="mt-4">
          <div className="text-[14pt] font-bold text-center">
            Vollmacht für die Beantragung eines beschleunigten
            Fachkräfteverfahrens
          </div>
        </div>
      ),
    },
  ];
}
