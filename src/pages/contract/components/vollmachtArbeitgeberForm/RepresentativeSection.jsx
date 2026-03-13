import FormInput from "../../FormInput";

export default function RepresentativeSection({ form, onFieldChange }) {
  return (
    <>
      {/* Representative name */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3 flex items-center gap-2">
          <span>👤</span> Vakil (Vertreten durch)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Vorname (Ism)"
            placeholder="z.B.: Patrick"
            name="employerRepFirstName"
            value={form?.employerRepFirstName || ""}
            onChange={(e) => onFieldChange("employerRepFirstName", e.target.value)}
          />

          <FormInput
            label="Nachname (Familiya)"
            placeholder="z.B.: Pott"
            name="employerRepLastName"
            value={form?.employerRepLastName || ""}
            onChange={(e) => onFieldChange("employerRepLastName", e.target.value)}
          />
        </div>
      </div>

      {/* Representative address */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3 flex items-center gap-2">
          <span>📍</span> Vakil manzili (Anschrift)
          <span className="text-sm text-base-content/60">
            (agar firma manzilidan farq qilsa)
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Straße (Ko'cha)"
              name="employerRepStreet"
              value={form?.employerRepStreet || ""}
              onChange={(e) => onFieldChange("employerRepStreet", e.target.value)}
            />

            <FormInput
              label="Hausnummer (Uy raqami)"
              name="employerRepHouseNumber"
              value={form?.employerRepHouseNumber || ""}
              onChange={(e) => onFieldChange("employerRepHouseNumber", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="PLZ (Pochta indeksi)"
              name="employerRepPostalCode"
              value={form?.employerRepPostalCode || ""}
              onChange={(e) => onFieldChange("employerRepPostalCode", e.target.value)}
            />

            <FormInput
              label="Ort (Shahar)"
              name="employerRepCity"
              value={form?.employerRepCity || ""}
              onChange={(e) => onFieldChange("employerRepCity", e.target.value)}
            />
          </div>

          <FormInput
            label="Land (Davlat)"
            name="employerRepCountry"
            value={form?.employerRepCountry || ""}
            onChange={(e) => onFieldChange("employerRepCountry", e.target.value)}
          />
        </div>
      </div>

      {/* Contact info */}
      <div>
        <h4 className="text-md font-medium mb-3 flex items-center gap-2">
          <span>☎️</span> Kontakt ma'lumotlari
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Telefonnummer"
            type="tel"
            placeholder="z.B.: +49 571 8867202"
            name="employerRepPhone"
            value={form?.employerRepPhone || ""}
            onChange={(e) => onFieldChange("employerRepPhone", e.target.value)}
          />

          <FormInput
            label="E-Mail"
            type="email"
            placeholder="email@example.com"
            name="employerRepEmail"
            value={form?.employerRepEmail || ""}
            onChange={(e) => onFieldChange("employerRepEmail", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
