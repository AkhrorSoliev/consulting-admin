import RenderField from "./RenderField";
import FormSection from "./FormSection";
import {
  candidateNameFields,
  candidateBirthFields,
  candidateAddressFields,
  candidateContactFields,
  candidateSignatureFields,
} from "../utils/fieldConfigs";

export default function CandidateForm({ form, onFieldChange, onOmitToggle }) {
  const fieldProps = { form, onFieldChange, onOmitToggle };

  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        👤 Vollmachtgeber (Kandidat)
      </div>

      {/* Personal Information */}
      <FormSection title="Persönliche Angaben">
        {candidateNameFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      {/* Birth Information */}
      <FormSection
        title="Geburtsdaten"
        gridClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {candidateBirthFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      {/* Address Information */}
      <FormSection
        title="Adresse"
        gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <RenderField
            fieldKey={candidateAddressFields[0].key}
            {...candidateAddressFields[0]}
            {...fieldProps}
          />
        </div>
        <RenderField
          fieldKey={candidateAddressFields[1].key}
          {...candidateAddressFields[1]}
          {...fieldProps}
        />
        <RenderField
          fieldKey={candidateAddressFields[2].key}
          {...candidateAddressFields[2]}
          {...fieldProps}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <RenderField
            fieldKey={candidateAddressFields[3].key}
            {...candidateAddressFields[3]}
            {...fieldProps}
          />
        </div>
        <RenderField
          fieldKey={candidateAddressFields[4].key}
          {...candidateAddressFields[4]}
          {...fieldProps}
        />
      </FormSection>

      {/* Contact Information */}
      <FormSection title="Kontaktdaten">
        {candidateContactFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      {/* Signature Information */}
      <FormSection
        title="Unterschrift"
        gridClassName="grid grid-cols-1 gap-4"
      >
        {candidateSignatureFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>
    </>
  );
}
