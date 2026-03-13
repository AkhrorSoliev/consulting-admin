import RenderField from "./RenderField";
import FormSection from "./FormSection";
import {
  employerBasicFields,
  employerRepresentativeFields,
  employerSignatureFields,
  dynamicFields,
} from "../utils/fieldConfigs";

export default function EmployerForm({ form, onFieldChange, onOmitToggle }) {
  const fieldProps = { form, onFieldChange, onOmitToggle };

  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        🏢 Arbeitgeber
      </div>

      {/* Company Information */}
      <FormSection title="Firmenangaben" colorClass="bg-secondary">
        {employerBasicFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      {/* Representative Information */}
      <FormSection
        title="Vertretungsberechtigte Person"
        colorClass="bg-secondary"
        gridClassName="grid grid-cols-1 gap-4"
      >
        {employerRepresentativeFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      {/* Employer Signature */}
      <FormSection
        title="Unterschrift"
        colorClass="bg-secondary"
        gridClassName="grid grid-cols-1 gap-4"
      >
        {employerSignatureFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>

      <div className="divider divider-start font-bold text-base-content/80">
        ⚙️ Dynamische Textfelder
      </div>
      <FormSection
        title="Zusätzliche Texte"
        colorClass="bg-accent"
        gridClassName=""
      >
        {dynamicFields.map((cfg) => (
          <RenderField key={cfg.key} fieldKey={cfg.key} {...cfg} {...fieldProps} />
        ))}
      </FormSection>
    </>
  );
}
