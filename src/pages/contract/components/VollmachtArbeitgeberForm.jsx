import CompanyInfoSection from "./vollmachtArbeitgeberForm/CompanyInfoSection";
import RepresentativeSection from "./vollmachtArbeitgeberForm/RepresentativeSection";

export default function VollmachtArbeitgeberForm({ form, onChange }) {
  const handleInputChange = (field, value) => {
    onChange?.({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      {/* Arbeitgeber (Ish beruvchi) */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>👔</span> Arbeitgeber (Ish beruvchi)
        </h3>

        <CompanyInfoSection form={form} onFieldChange={handleInputChange} />
        <RepresentativeSection form={form} onFieldChange={handleInputChange} />
      </div>
    </div>
  );
}
