import { Text, View } from "@react-pdf/renderer";
import s from "./styles";
import { hasValue } from "./utils";

export default function FieldWithLabel({ value, label, style, omit }) {
  if (omit) return null;
  const filled = hasValue(value);
  return (
    <View style={[s.fieldRow, style]}>
      <View
        style={[
          s.fieldValue,
          !filled && s.fieldValueUnderline,
          { minHeight: filled ? 12 : 14 },
        ]}
      >
        {filled ? (
          <Text>{value}</Text>
        ) : (
          <Text style={s.placeholderText}>____________________</Text>
        )}
      </View>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
    </View>
  );
}
