import { UZBEK_REGIONS } from "../../../../constants/uzbekRegions";

const PICKER_CONFIGS = [
  {
    key: "birthPlace",
    title: "Geburtsort",
    field: "birthPlace",
    options: UZBEK_REGIONS,
  },
  {
    key: "maritalStatus",
    title: "Familienstand",
    field: "maritalStatus",
    options: ["ledig", "verheiratet", "geschieden", "verwitwet"],
  },
];

export default function MobilePickerOverlay({
  isMobile,
  showBirthPlacePicker,
  setShowBirthPlacePicker,
  showMaritalStatusPicker,
  setShowMaritalStatusPicker,
  formCv,
  setFormCv,
}) {
  const pickers = [
    { ...PICKER_CONFIGS[0], show: showBirthPlacePicker, setShow: setShowBirthPlacePicker },
    { ...PICKER_CONFIGS[1], show: showMaritalStatusPicker, setShow: setShowMaritalStatusPicker },
  ];

  return pickers.map((picker) =>
    isMobile && picker.show ? (
      <div
        key={picker.field}
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
        onClick={() => picker.setShow(false)}
      >
        <div
          className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 pt-3 pb-2 flex justify-center">
            <div className="w-12 h-1 bg-base-300 rounded-full" />
          </div>
          <div className="shrink-0 px-4 pb-3 border-b border-base-200">
            <h3 className="font-bold text-lg text-center">{picker.title}</h3>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-3 space-y-1">
              {picker.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFormCv((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        [picker.field]: option,
                      },
                    }));
                    picker.setShow(false);
                  }}
                  className={`
                    w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                    active:scale-98
                    ${
                      formCv.personalInfo[picker.field] === option
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-200 active:bg-base-300"
                    }
                  `}
                >
                  {option}
                  {formCv.personalInfo[picker.field] === option && (
                    <span className="float-right">{"\u2713"}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : null,
  );
}
