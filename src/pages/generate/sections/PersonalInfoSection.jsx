import FormInput from "../../../components/FormInput";
import PhoneInputWithCountry from "../../../components/PhoneInputWithCountry";
import CountryNameCombobox from "../../../components/CountryNameCombobox";
import { normalizePassportNumber } from "../../../utils/validation";
import { UZBEK_REGIONS } from "../../../constants/uzbekRegions";

export default function PersonalInfoSection({
  isLimitedAdmin,
  remoteMode,
  formCv,
  setFormCv,
  toInputDate,
  fromInputDate,
  isMobile,
  setShowBirthPlacePicker,
  selectBase,
  setShowMaritalStatusPicker,
  inputBase,
  noChildren,
  childrenCount,
  setPhoneTouched,
  phoneShowOk,
  phoneWarn,
  phoneDigits,
  passportNumber,
  setPassportTouched,
  passportShowOk,
  passportWarn,
  setEmailTouched,
  emailShowOk,
  emailWarn,
  fileInputBase,
  handlePhotoFileChange,
  addressFields,
  applyAddressFields,
}) {
  return (
    <fieldset disabled={isLimitedAdmin || remoteMode} className="space-y-4 disabled:opacity-70">
      <div className="divider mt-2">Persönliche Daten</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Vorname"
          placeholder="Vorname"
          value={formCv.personalInfo.name}
          onChange={(e) =>
            setFormCv((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                name: e.target.value,
              },
            }))
          }
        />
        <FormInput
          label="Nachname"
          placeholder="Nachname"
          value={formCv.personalInfo.lastName}
          onChange={(e) =>
            setFormCv((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                lastName: e.target.value,
              },
            }))
          }
        />
        <div className="md:col-span-2">
          <label className="label">
            <span className="label-text">Geschlecht</span>
          </label>
          <div className="flex gap-6">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="radio"
                value="Männlich"
                className="radio radio-primary"
                checked={formCv.personalInfo.gender === "Männlich"}
                onChange={(e) =>
                  setFormCv((prev) => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      gender: e.target.value,
                    },
                  }))
                }
              />
              <span>Männlich</span>
            </label>
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="radio"
                value="Weiblich"
                className="radio radio-primary"
                checked={formCv.personalInfo.gender === "Weiblich"}
                onChange={(e) =>
                  setFormCv((prev) => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      gender: e.target.value,
                    },
                  }))
                }
              />
              <span>Weiblich</span>
            </label>
          </div>
        </div>
        <FormInput
          label="Geburtsdatum"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(formCv.personalInfo.birthDate)}
          onChange={(e) =>
            setFormCv((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                birthDate: fromInputDate(e.target.value),
              },
            }))
          }
        />
        <div className="form-control w-full">
          <label className="label" htmlFor="g-birthPlace">
            <span className="label-text">Geburtsort</span>
          </label>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setShowBirthPlacePicker(true)}
              className={`
                w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                transition-all active:scale-98
                ${
                  formCv.personalInfo.birthPlace
                    ? "border-success bg-success/5 text-base-content"
                    : "border-base-300 bg-base-100 text-base-content/60"
                }
              `}
            >
              <span className="text-base">{formCv.personalInfo.birthPlace || "Bitte auswählen"}</span>
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <select
              id="g-birthPlace"
              className={selectBase}
              value={String(formCv.personalInfo.birthPlace || "")}
              onChange={(e) =>
                setFormCv((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    birthPlace: e.target.value,
                  },
                }))
              }
            >
              <option value="">Bitte auswählen</option>
              {UZBEK_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="form-control w-full">
          <label className="label" htmlFor="g-marital">
            <span className="label-text">Familienstand</span>
          </label>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setShowMaritalStatusPicker(true)}
              className={`
                w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                transition-all active:scale-98
                ${
                  formCv.personalInfo.maritalStatus
                    ? "border-success bg-success/5 text-base-content"
                    : "border-base-300 bg-base-100 text-base-content/60"
                }
              `}
            >
              <span className="text-base">{formCv.personalInfo.maritalStatus || "Bitte auswählen"}</span>
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <select
              id="g-marital"
              className={selectBase}
              value={formCv.personalInfo.maritalStatus}
              onChange={(e) =>
                setFormCv((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    maritalStatus: e.target.value,
                  },
                }))
              }
            >
              <option value="">Bitte auswählen</option>
              <option value="ledig">ledig</option>
              <option value="verheiratet">verheiratet</option>
              <option value="geschieden">geschieden</option>
              <option value="verwitwet">verwitwet</option>
            </select>
          )}
        </div>
        <div className="md:col-span-2 form-control w-full">
          <label className="label" htmlFor="g-childrenCount">
            <span className="label-text">Kinder *</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              id="g-childrenCount"
              type="number"
              min={0}
              inputMode="numeric"
              className={inputBase}
              placeholder="0"
              disabled={noChildren}
              value={childrenCount}
              onChange={(e) => {
                const raw = String(e.target.value || "");
                const cleaned = raw.replace(/[^\d]/g, "");
                setFormCv((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    childrenCount: cleaned,
                  },
                }));
              }}
            />
            <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
              <input
                type="checkbox"
                className="checkbox"
                checked={noChildren}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormCv((prev) => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      noChildren: checked,
                      childrenCount: checked
                        ? ""
                        : String(prev.personalInfo.childrenCount || ""),
                    },
                  }));
                }}
              />
              <span className="text-sm">Keine Kinder</span>
            </label>
          </div>
        </div>
        <div className="md:col-span-2 form-control w-full">
          {/* Führerschein moved to Fähigkeiten section */}
        </div>
        <div className="md:col-span-2">
          <PhoneInputWithCountry
            label="Telefonnummer"
            required
            value={formCv.personalInfo.phone}
            onChange={(next) => {
              setPhoneTouched(true);
              setFormCv((prev) => ({
                ...prev,
                personalInfo: {
                  ...prev.personalInfo,
                  phone: next,
                },
              }));
            }}
            inputClassName={phoneShowOk ? "input-success" : phoneWarn ? "input-warning" : ""}
            helperText={
              phoneWarn ? (
                <span className="text-warning">Telefonnummer unvollständig ({phoneDigits.length}/9 Ziffern)</span>
              ) : null
            }
          />
        </div>
        <FormInput
          label="Passnummer"
          placeholder="AA 0000000"
          value={passportNumber}
          onChange={(e) => {
            setPassportTouched(true);
            const norm = normalizePassportNumber(e.target.value);
            setFormCv((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                passportNumber: norm,
              },
            }));
          }}
          inputClassName={passportShowOk ? "input-success" : passportWarn ? "input-warning" : ""}
          helperText={
            passportWarn ? <span className="text-warning">Bitte Passnummer im Format AA 0000000 eingeben.</span> : ""
          }
        />
        <FormInput
          label="E-Mail"
          placeholder="E-Mail"
          type="email"
          value={formCv.personalInfo.email}
          onChange={(e) => {
            setEmailTouched(true);
            setFormCv((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                email: e.target.value,
              },
            }));
          }}
          inputClassName={emailShowOk ? "input-success" : emailWarn ? "input-warning" : ""}
          helperText={emailWarn ? <span className="text-warning">Bitte gültige E-Mail eingeben.</span> : ""}
        />

        <div className="md:col-span-2 form-control w-full">
          <label className="label pb-1 flex-col items-start gap-1" htmlFor="g-photo-file">
            <span className="label-text font-medium">Foto hochladen (JPEG/PNG) (Ihr eigenes Foto)</span>
            <span className="label-text-alt text-xs text-base-content/70">Eigenes 3×4‑Passfoto. Bis 250 KB</span>
          </label>
          <input
            id="g-photo-file"
            type="file"
            accept="image/*"
            className={fileInputBase}
            onChange={handlePhotoFileChange}
          />
        </div>

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
      </div>
    </fieldset>
  );
}
