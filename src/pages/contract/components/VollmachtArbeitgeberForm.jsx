import FormInput from "../FormInput";

export default function VollmachtArbeitgeberForm({ form, onChange }) {
  const handleInputChange = (field, value) => {
    onChange?.({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      {/* 👔 Arbeitgeber (Ish beruvchi) */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>👔</span> Arbeitgeber (Ish beruvchi)
        </h3>

        {/* 🏢 Firma ma'lumotlari */}
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
              onChange={(e) =>
                handleInputChange("employerCompanyName", e.target.value)
              }
            />

            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Geschäftssitz – Straße (Ko'cha)"
                placeholder="z.B.: Bergkirchener Str."
                name="employerStreet"
                value={form?.employerStreet || ""}
                onChange={(e) =>
                  handleInputChange("employerStreet", e.target.value)
                }
              />

              <FormInput
                label="Hausnummer (Uy raqami)"
                placeholder="z.B.: 99"
                name="employerHouseNumber"
                value={form?.employerHouseNumber || ""}
                onChange={(e) =>
                  handleInputChange("employerHouseNumber", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="PLZ (Pochta indeksi)"
                placeholder="z.B.: 32429"
                name="employerPostalCode"
                value={form?.employerPostalCode || ""}
                onChange={(e) =>
                  handleInputChange("employerPostalCode", e.target.value)
                }
              />

              <FormInput
                label="Ort (Shahar)"
                placeholder="z.B.: Minden"
                name="employerCity"
                value={form?.employerCity || ""}
                onChange={(e) =>
                  handleInputChange("employerCity", e.target.value)
                }
              />
            </div>

            <FormInput
              label="Land (Davlat)"
              placeholder="z.B.: Deutschland"
              name="employerCountry"
              value={form?.employerCountry || ""}
              onChange={(e) =>
                handleInputChange("employerCountry", e.target.value)
              }
            />
          </div>
        </div>

        {/* 👤 Vakil (Vertreten durch) */}
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
              onChange={(e) =>
                handleInputChange("employerRepFirstName", e.target.value)
              }
            />

            <FormInput
              label="Nachname (Familiya)"
              placeholder="z.B.: Pott"
              name="employerRepLastName"
              value={form?.employerRepLastName || ""}
              onChange={(e) =>
                handleInputChange("employerRepLastName", e.target.value)
              }
            />
          </div>
        </div>

        {/* 📍 Vakil manzili (Anschrift) */}
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
                onChange={(e) =>
                  handleInputChange("employerRepStreet", e.target.value)
                }
              />

              <FormInput
                label="Hausnummer (Uy raqami)"
                name="employerRepHouseNumber"
                value={form?.employerRepHouseNumber || ""}
                onChange={(e) =>
                  handleInputChange("employerRepHouseNumber", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="PLZ (Pochta indeksi)"
                name="employerRepPostalCode"
                value={form?.employerRepPostalCode || ""}
                onChange={(e) =>
                  handleInputChange("employerRepPostalCode", e.target.value)
                }
              />

              <FormInput
                label="Ort (Shahar)"
                name="employerRepCity"
                value={form?.employerRepCity || ""}
                onChange={(e) =>
                  handleInputChange("employerRepCity", e.target.value)
                }
              />
            </div>

            <FormInput
              label="Land (Davlat)"
              name="employerRepCountry"
              value={form?.employerRepCountry || ""}
              onChange={(e) =>
                handleInputChange("employerRepCountry", e.target.value)
              }
            />
          </div>
        </div>

        {/* ☎️ Kontakt ma'lumotlari */}
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
              onChange={(e) =>
                handleInputChange("employerRepPhone", e.target.value)
              }
            />

            <FormInput
              label="E-Mail"
              type="email"
              placeholder="email@example.com"
              name="employerRepEmail"
              value={form?.employerRepEmail || ""}
              onChange={(e) =>
                handleInputChange("employerRepEmail", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
