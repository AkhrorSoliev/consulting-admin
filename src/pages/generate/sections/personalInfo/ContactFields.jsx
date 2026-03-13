import FormInput from "../../../../components/FormInput";
import PhoneInputWithCountry from "../../../../components/PhoneInputWithCountry";
import { normalizePassportNumber } from "../../../../utils/validation";

export default function ContactFields({
  formCv,
  setFormCv,
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
}) {
  return (
    <>
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
          inputClassName={
            phoneShowOk ? "input-success" : phoneWarn ? "input-warning" : ""
          }
          helperText={
            phoneWarn ? (
              <span className="text-warning">
                Telefonnummer unvollständig ({phoneDigits.length}/9 Ziffern)
              </span>
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
        inputClassName={
          passportShowOk ? "input-success" : passportWarn ? "input-warning" : ""
        }
        helperText={
          passportWarn ? (
            <span className="text-warning">
              Bitte Passnummer im Format AA 0000000 eingeben.
            </span>
          ) : (
            ""
          )
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
        inputClassName={
          emailShowOk ? "input-success" : emailWarn ? "input-warning" : ""
        }
        helperText={
          emailWarn ? (
            <span className="text-warning">
              Bitte gültige E-Mail eingeben.
            </span>
          ) : (
            ""
          )
        }
      />
    </>
  );
}
