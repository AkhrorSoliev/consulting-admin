import NameGenderFields from "./personalInfo/NameGenderFields";
import BirthDatePlaceFields from "./personalInfo/BirthDatePlaceFields";
import MaritalChildrenFields from "./personalInfo/MaritalChildrenFields";
import ContactFields from "./personalInfo/ContactFields";
import PhotoUploadField from "./personalInfo/PhotoUploadField";
import AddressFields from "./personalInfo/AddressFields";

export default function PersonalInfoFields({
  formCv,
  setFormCv,
  addressFields,
  applyAddressFields,
  isLimitedAdmin,
  remoteMode,
  isMobile,
  showBirthPlacePicker,
  setShowBirthPlacePicker,
  showMaritalStatusPicker,
  setShowMaritalStatusPicker,
  handlePhotoFileChange,
  phoneTouched,
  setPhoneTouched,
  passportTouched,
  setPassportTouched,
  emailTouched,
  setEmailTouched,
  inputBase,
  selectBase,
  fileInputBase,
  phoneShowOk,
  phoneWarn,
  phoneDigits,
  passportShowOk,
  passportWarn,
  passportNumber,
  emailShowOk,
  emailWarn,
  noChildren,
  childrenCount,
  toInputDate,
  fromInputDate,
}) {
  const updatePersonalInfo = (field, value) => {
    setFormCv((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  return (
    <fieldset
      disabled={isLimitedAdmin || remoteMode}
      className="space-y-4 disabled:opacity-70"
    >
      <div className="divider mt-2">Persönliche Daten</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NameGenderFields
          formCv={formCv}
          updatePersonalInfo={updatePersonalInfo}
        />
        <BirthDatePlaceFields
          formCv={formCv}
          updatePersonalInfo={updatePersonalInfo}
          isMobile={isMobile}
          selectBase={selectBase}
          showBirthPlacePicker={showBirthPlacePicker}
          setShowBirthPlacePicker={setShowBirthPlacePicker}
          toInputDate={toInputDate}
          fromInputDate={fromInputDate}
        />
        <MaritalChildrenFields
          formCv={formCv}
          setFormCv={setFormCv}
          updatePersonalInfo={updatePersonalInfo}
          isMobile={isMobile}
          selectBase={selectBase}
          inputBase={inputBase}
          showMaritalStatusPicker={showMaritalStatusPicker}
          setShowMaritalStatusPicker={setShowMaritalStatusPicker}
          noChildren={noChildren}
          childrenCount={childrenCount}
        />
        <ContactFields
          formCv={formCv}
          updatePersonalInfo={updatePersonalInfo}
          phoneTouched={phoneTouched}
          setPhoneTouched={setPhoneTouched}
          passportTouched={passportTouched}
          setPassportTouched={setPassportTouched}
          emailTouched={emailTouched}
          setEmailTouched={setEmailTouched}
          phoneShowOk={phoneShowOk}
          phoneWarn={phoneWarn}
          phoneDigits={phoneDigits}
          passportShowOk={passportShowOk}
          passportWarn={passportWarn}
          passportNumber={passportNumber}
          emailShowOk={emailShowOk}
          emailWarn={emailWarn}
        />
        <PhotoUploadField
          fileInputBase={fileInputBase}
          handlePhotoFileChange={handlePhotoFileChange}
        />
        <AddressFields
          addressFields={addressFields}
          applyAddressFields={applyAddressFields}
          inputBase={inputBase}
          selectBase={selectBase}
        />
      </div>
    </fieldset>
  );
}
