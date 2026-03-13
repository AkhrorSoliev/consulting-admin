import { Text, View } from "@react-pdf/renderer";
import s from "./styles";
import { hasValue, getOmitKey } from "./utils";

export default function SignatureSection({ form }) {
  const isOmitted = (fieldKey) => Boolean(form?.[getOmitKey(fieldKey)]);

  return (
    <View style={s.signatureSection}>
      <View style={s.signatureBlock}>
        {isOmitted("candidatePlaceDate") ? null : (
          <View style={s.formRow}>
            <Text style={s.formLabel}>
              {form?.candidateBirthPlace || "Ort"},{" "}
            </Text>
            {hasValue(form?.candidatePlaceDate) ? (
              <Text style={s.formValue}>{form.candidatePlaceDate}</Text>
            ) : (
              <View style={s.formUnderline} />
            )}
          </View>
        )}
        <View style={s.signatureLabel}>
          <Text></Text>
        </View>
      </View>

      <View style={s.signatureBlock}>
        {isOmitted("employerPlaceDate") ? null : (
          <View style={s.formRow}>
            <Text style={s.formLabel}>{form?.employerCity || "Ort"},</Text>
          </View>
        )}
        <View style={s.signatureLabel}>
          <Text></Text>
        </View>
      </View>
    </View>
  );
}
