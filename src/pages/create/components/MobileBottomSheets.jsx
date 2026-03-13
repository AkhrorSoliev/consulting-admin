import { useMemo } from "react";
import { UZBEK_REGIONS } from "../../../constants/uzbekRegions";
import countries from "../../../utils/const";
import BottomSheetPicker from "./BottomSheetPicker";

/**
 * All mobile bottom-sheet pickers used in the Create form
 * (city, country, birth place, marital status).
 *
 * Props:
 *   isMobile, setValue, clearErrors,
 *   showCityPicker, setShowCityPicker, addressCity,
 *   showCountryPicker, setShowCountryPicker, addressCountry,
 *   showBirthPlacePicker, setShowBirthPlacePicker, watchBirthPlace,
 *   showMaritalStatusPicker, setShowMaritalStatusPicker, watchMaritalStatus
 */

const MARITAL_OPTIONS = [
  { value: "ledig", label: "ledig" },
  { value: "verheiratet", label: "verheiratet" },
  { value: "geschieden", label: "geschieden" },
  { value: "verwitwet", label: "verwitwet" },
];

export default function MobileBottomSheets({
  isMobile,
  setValue,
  clearErrors,
  showCityPicker,
  setShowCityPicker,
  addressCity,
  showCountryPicker,
  setShowCountryPicker,
  addressCountry,
  showBirthPlacePicker,
  setShowBirthPlacePicker,
  watchBirthPlace,
  showMaritalStatusPicker,
  setShowMaritalStatusPicker,
  watchMaritalStatus,
}) {
  const regionItems = useMemo(
    () => UZBEK_REGIONS.map((c) => ({ value: c, label: c })),
    [],
  );

  const countryItems = useMemo(
    () =>
      countries
        .sort((a, b) => {
          const priority = [
            "Usbekistan",
            "Deutschland",
            "Russland",
            "Südkorea",
          ];
          const aI = priority.indexOf(a.deu);
          const bI = priority.indexOf(b.deu);
          if (aI !== -1 && bI !== -1) return aI - bI;
          if (aI !== -1) return -1;
          if (bI !== -1) return 1;
          return a.deu.localeCompare(b.deu);
        })
        .map((c) => ({ value: c.deu, label: c.deu })),
    [],
  );

  if (!isMobile) return null;

  const selectField = (name, value, closeFn) => {
    setValue(name, value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    clearErrors(name);
    closeFn(false);
  };

  return (
    <>
      <BottomSheetPicker
        open={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        title="Stadt wählen"
        subtitle="Ort"
        items={regionItems}
        selected={addressCity}
        onSelect={(v) =>
          selectField(
            "personalInfo.addressCity",
            v,
            setShowCityPicker,
          )
        }
      />

      <BottomSheetPicker
        open={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        title="Land wählen"
        subtitle="Land"
        items={countryItems}
        selected={addressCountry}
        onSelect={(v) =>
          selectField(
            "personalInfo.addressCountry",
            v,
            setShowCountryPicker,
          )
        }
      />

      <BottomSheetPicker
        open={showBirthPlacePicker}
        onClose={() => setShowBirthPlacePicker(false)}
        title="Geburtsort wählen"
        subtitle="Geburtsort"
        items={regionItems}
        selected={watchBirthPlace}
        onSelect={(v) =>
          selectField(
            "personalInfo.birthPlace",
            v,
            setShowBirthPlacePicker,
          )
        }
      />

      <BottomSheetPicker
        open={showMaritalStatusPicker}
        onClose={() => setShowMaritalStatusPicker(false)}
        title="Familienstand wählen"
        subtitle="Familienstand"
        items={MARITAL_OPTIONS}
        selected={watchMaritalStatus}
        onSelect={(v) =>
          selectField(
            "personalInfo.maritalStatus",
            v,
            setShowMaritalStatusPicker,
          )
        }
      />
    </>
  );
}
