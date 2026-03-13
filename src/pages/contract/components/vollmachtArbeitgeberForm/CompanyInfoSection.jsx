import FormInput from "../../FormInput";

export default function CompanyInfoSection({ form, onFieldChange }) {
  return (
    <div className="mb-6">
      <h4 className="text-md font-medium mb-3 flex items-center gap-2">
        <span>🏢</span> Firma ma'lumotlari
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Firmenname (Firma nomi)"
          placeholder="z.B.: Heinrich Pott GmbH & Co. KG"
          name="employerCompanyName"
          value={form?.employerCompanyName || ""}
          onChange={(e) => onFieldChange("employerCompanyName", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormInput
            label="Geschäftssitz – Straße (Ko'cha)"
            placeholder="z.B.: Bergkirchener Str."
            name="employerStreet"
            value={form?.employerStreet || ""}
            onChange={(e) => onFieldChange("employerStreet", e.target.value)}
          />

          <FormInput
            label="Hausnummer (Uy raqami)"
            placeholder="z.B.: 99"
            name="employerHouseNumber"
            value={form?.employerHouseNumber || ""}
            onChange={(e) => onFieldChange("employerHouseNumber", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormInput
            label="PLZ (Pochta indeksi)"
            placeholder="z.B.: 32429"
            name="employerPostalCode"
            value={form?.employerPostalCode || ""}
            onChange={(e) => onFieldChange("employerPostalCode", e.target.value)}
          />

          <FormInput
            label="Ort (Shahar)"
            placeholder="z.B.: Minden"
            name="employerCity"
            value={form?.employerCity || ""}
            onChange={(e) => onFieldChange("employerCity", e.target.value)}
          />
        </div>

        <FormInput
          label="Land (Davlat)"
          placeholder="z.B.: Deutschland"
          name="employerCountry"
          value={form?.employerCountry || ""}
          onChange={(e) => onFieldChange("employerCountry", e.target.value)}
        />
      </div>
    </div>
  );
}
