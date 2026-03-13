import VollmachtArbeitgeberFormField from "./VollmachtArbeitgeberFormField";
import {
  candidateNameFields,
  candidateBirthFields,
  candidateAddressFields,
  candidateContactFields,
  candidateSignatureFields,
} from "./vollmachtArbeitgeberFieldConfigs";

function FieldGroup({ title, color = "primary", gridClass, children }) {
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

export default function CandidateFormSection({
  form,
  onFieldChange,
  onOmitToggle,
}) {
  const rf = (fields) => renderFields(fields, form, onFieldChange, onOmitToggle);
  const addressFields = candidateAddressFields;

  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        {"\uD83D\uDC64"} Vollmachtgeber (Kandidat)
      </div>

      <FieldGroup
        title="Pers\u00F6nliche Angaben"
        gridClass="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {rf(candidateNameFields)}
      </FieldGroup>

      <FieldGroup
        title="Geburtsdaten"
        gridClass="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {rf(candidateBirthFields)}
      </FieldGroup>

      <FieldGroup
        title="Adresse"
        gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <VollmachtArbeitgeberFormField
            fieldKey={addressFields[0].key}
            label={addressFields[0].label}
            placeholder={addressFields[0].placeholder}
            form={form}
            onFieldChange={onFieldChange}
            onOmitToggle={onOmitToggle}
          />
        </div>
        {rf(addressFields.slice(1, 3))}
        <div className="sm:col-span-2 lg:col-span-1">
          <VollmachtArbeitgeberFormField
            fieldKey={addressFields[3].key}
            label={addressFields[3].label}
            placeholder={addressFields[3].placeholder}
            form={form}
            onFieldChange={onFieldChange}
            onOmitToggle={onOmitToggle}
          />
        </div>
        <VollmachtArbeitgeberFormField
          fieldKey={addressFields[4].key}
          label={addressFields[4].label}
          placeholder={addressFields[4].placeholder}
          form={form}
          onFieldChange={onFieldChange}
          onOmitToggle={onOmitToggle}
        />
      </FieldGroup>

      <FieldGroup
        title="Kontaktdaten"
        gridClass="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {rf(candidateContactFields)}
      </FieldGroup>

      <FieldGroup
        title="Unterschrift"
        gridClass="grid grid-cols-1 gap-4"
      >
        {rf(candidateSignatureFields)}
      </FieldGroup>
    </>
  );
}
