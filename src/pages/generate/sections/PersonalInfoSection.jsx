import NameGenderFields from "./personalInfo/NameGenderFields";
import BirthDatePlaceFields from "./personalInfo/BirthDatePlaceFields";
import MaritalChildrenFields from "./personalInfo/MaritalChildrenFields";
import ContactFields from "./personalInfo/ContactFields";
import PhotoUploadField from "./personalInfo/PhotoUploadField";
import AddressFields from "./personalInfo/AddressFields";

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
    <fieldset
      disabled={isLimitedAdmin || remoteMode}
      className="space-y-4 disabled:opacity-70"
    >
      <div className="divider mt-2">Persönliche Daten</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NameGenderFields formCv={formCv} setFormCv={setFormCv} />

        <BirthDatePlaceFields
          formCv={formCv}
          setFormCv={setFormCv}
          toInputDate={toInputDate}
          fromInputDate={fromInputDate}
          isMobile={isMobile}
          setShowBirthPlacePicker={setShowBirthPlacePicker}
          selectBase={selectBase}
        />

        <MaritalChildrenFields
          formCv={formCv}
          setFormCv={setFormCv}
          isMobile={isMobile}
          setShowMaritalStatusPicker={setShowMaritalStatusPicker}
          selectBase={selectBase}
          inputBase={inputBase}
          noChildren={noChildren}
          childrenCount={childrenCount}
        />

        <ContactFields
          formCv={formCv}
          setFormCv={setFormCv}
          setPhoneTouched={setPhoneTouched}
          phoneShowOk={phoneShowOk}
          phoneWarn={phoneWarn}
          phoneDigits={phoneDigits}
          passportNumber={passportNumber}
          setPassportTouched={setPassportTouched}
          passportShowOk={passportShowOk}
          passportWarn={passportWarn}
          setEmailTouched={setEmailTouched}
          emailShowOk={emailShowOk}
          emailWarn={emailWarn}
        />

        <PhotoUploadField
          fileInputBase={fileInputBase}
          handlePhotoFileChange={handlePhotoFileChange}
        />

        <AddressFields
          inputBase={inputBase}
          selectBase={selectBase}
          addressFields={addressFields}
          applyAddressFields={applyAddressFields}
        />
      </div>
    </fieldset>
  );
}
