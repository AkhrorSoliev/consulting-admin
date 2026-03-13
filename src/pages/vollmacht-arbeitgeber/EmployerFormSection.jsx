import VollmachtArbeitgeberFormField from "./VollmachtArbeitgeberFormField";
import {
  employerBasicFields,
  employerRepresentativeFields,
  employerSignatureFields,
  dynamicFields,
} from "./vollmachtArbeitgeberFieldConfigs";

function FieldGroup({ title, color = "secondary", gridClass, children }) {
  return (
    <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
        <span className={`w-1 h-4 bg-${color} rounded-full`}></span>
        {title}
      </h3>
      <div className={gridClass}>{children}</div>
    </div>
  );
}

function renderFields(fields, form, onFieldChange, onOmitToggle) {
  return fields.map((cfg) => (
    <VollmachtArbeitgeberFormField
      key={cfg.key}
      fieldKey={cfg.key}
      label={cfg.label}
      placeholder={cfg.placeholder}
      helperText={cfg.helperText}
      type={cfg.type}
      allowOmit={cfg.allowOmit}
      form={form}
      onFieldChange={onFieldChange}
      onOmitToggle={onOmitToggle}
    />
  ));
}

export default function EmployerFormSection({
  form,
  onFieldChange,
  onOmitToggle,
}) {
  const rf = (fields) => renderFields(fields, form, onFieldChange, onOmitToggle);

  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        {"\uD83C\uDFE2"} Arbeitgeber
      </div>

      <FieldGroup
        title="Firmenangaben"
        gridClass="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {rf(employerBasicFields)}
      </FieldGroup>

      <FieldGroup
        title="Vertretungsberechtigte Person"
        gridClass="grid grid-cols-1 gap-4"
      >
        {rf(employerRepresentativeFields)}
      </FieldGroup>

      <FieldGroup
        title="Unterschrift"
        gridClass="grid grid-cols-1 gap-4"
      >
        {rf(employerSignatureFields)}
      </FieldGroup>

      <div className="divider divider-start font-bold text-base-content/80">
        {"\u2699\uFE0F"} Dynamische Textfelder
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          Zus{"ä"}tzliche Texte
        </h3>
        {rf(dynamicFields)}
      </div>
    </>
  );
}
