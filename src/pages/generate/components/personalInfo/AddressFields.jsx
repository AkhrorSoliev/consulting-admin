import CountryNameCombobox from "../../../../components/CountryNameCombobox";
import { UZBEK_REGIONS } from "../../../../constants/uzbekRegions";

export default function AddressFields({
  addressFields,
  applyAddressFields,
  inputBase,
  selectBase,
}) {
  return (
    <div className="md:col-span-2 form-control w-full">
      <label className="label pb-1" htmlFor="g-addressStreet">
        <span className="label-text font-medium">Adresse</span>
      </label>
      <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="g-addressStreet">
              <span className="label-text">Straße *</span>
            </label>
            <input
              id="g-addressStreet"
              type="text"
              className={inputBase}
              placeholder="Straße"
              value={addressFields.street}
              onChange={(e) =>
                applyAddressFields({
                  ...addressFields,
                  street: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="label" htmlFor="g-addressHouseNumber">
              <span className="label-text">Hausnummer *</span>
            </label>
            <input
              id="g-addressHouseNumber"
              type="text"
              className={inputBase}
              placeholder="z.B. 12A"
              value={addressFields.houseNumber}
              onChange={(e) =>
                applyAddressFields({
                  ...addressFields,
                  houseNumber: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="label" htmlFor="g-addressPostalCode">
              <span className="label-text">PLZ *</span>
            </label>
            <input
              id="g-addressPostalCode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={inputBase}
              placeholder="123456"
              value={String(addressFields.postalCode || "")}
              onChange={(e) =>
                applyAddressFields({
                  ...addressFields,
                  postalCode: String(e.target.value || "")
                    .replace(/[^\d]/g, "")
                    .slice(0, 6),
                })
              }
            />
          </div>

          <div>
            <label className="label" htmlFor="g-addressCity">
              <span className="label-text">Ort *</span>
            </label>
            <select
              id="g-addressCity"
              className={selectBase}
              value={addressFields.city}
              onChange={(e) =>
                applyAddressFields({
                  ...addressFields,
                  city: e.target.value,
                })
              }
            >
              <option value="">Bitte auswählen</option>
              {UZBEK_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <CountryNameCombobox
              id="g-addressCountry"
              label="Land"
              required
              placeholder="Usbekistan"
              value={addressFields.country}
              onChange={(v) =>
                applyAddressFields({
                  ...addressFields,
                  country: String(v || ""),
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
