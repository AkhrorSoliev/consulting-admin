import { SafeInline } from "./utils";

function FormRow({ label, value }) {
  const hasValue = String(value || "").trim().length > 0;
  return (
    <div className="flex mt-[6pt]">
      <div className="w-[140px] shrink-0">{label}:</div>
      {hasValue ? (
        <div className="flex-1 min-h-[14pt]">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
      )}
    </div>
  );
}

function EmptyFormRow({ label }) {
  return (
    <div className="flex mt-[6pt]">
      <div className="w-[140px] shrink-0">{label}:</div>
      <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
    </div>
  );
}

export default function buildRozilikXatiBlocks(form) {
  const currentYear = new Date().getFullYear();

  const nomzodIsm = String(form?.nomzodIsm || "").trim();
  const nomzodFamilya = String(form?.nomzodFamilya || "").trim();
  const nomzodJinsi = String(form?.nomzodJinsi || "").trim();
  const nomzodTugilganSana = String(form?.nomzodTugilganSana || "").trim();
  const nomzodManzil = String(form?.nomzodManzil || "").trim();
  const nomzodOqishJoyi = String(form?.nomzodOqishJoyi || "").trim();
  const nomzodTelefon = String(form?.nomzodTelefon || "").trim();
  const joy = String(form?.joy || "").trim();
  const sana = String(form?.sana || "").trim();

  const hasValue = (v) => String(v || "").trim().length > 0;

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center mb-[20pt]">
          <div className="text-[12pt] font-bold text-blue-600">
            {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashga rozilik xati
          </div>
        </div>
      ),
    },
    {
      id: "nomzod-section",
      keepWithNext: true,
      node: (
        <div>
          <div className="text-[11pt] font-bold italic mt-[16pt] mb-[8pt]">
            NOMZOD HAQIDA MA'LUMOTLAR:
          </div>
          <FormRow label="Ismi" value={nomzodIsm} />
          <FormRow label="Familyasi" value={nomzodFamilya} />
          <FormRow label="Jinsi" value={nomzodJinsi} />
          <FormRow label="Tug'ilgan sanasi" value={nomzodTugilganSana} />
          <FormRow label="Manzili" value={nomzodManzil} />
          <FormRow label="O'qish joyi" value={nomzodOqishJoyi} />
          <FormRow label="Telefon raqami" value={nomzodTelefon} />
        </div>
      ),
    },
    {
      id: "beruvchi-section",
      node: (
        <div>
          <div className="text-[11pt] font-bold italic mt-[16pt] mb-[8pt]">
            NOMZODGA ROZILIK XATI BERUVCHI SHAXS HAQIDA MA'LUMOTLAR:
          </div>
          <EmptyFormRow label="Rozilik xati beruvchi shaxs" />
          <EmptyFormRow label="Ismi" />
          <EmptyFormRow label="Familyasi" />
          <EmptyFormRow label="Jinsi" />
          <EmptyFormRow label="Tug'ilgan sanasi" />
          <EmptyFormRow label="Manzili" />
          <EmptyFormRow label="Ish joyi" />
          <EmptyFormRow label="Telefon raqami" />
        </div>
      ),
    },
    {
      id: "content",
      node: (
        <div>
          <div className="text-[11pt] font-bold mt-[16pt] mb-[8pt]">
            ROZILIK XATI MAZMUNI:
          </div>
          <div className="mt-[12pt] text-justify">
            Yuqorida ma'lumotlari keltirilgan farzandimning {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashiga roziman va uning salomatligi hamda xulqi uchun javobgarlikni o'z bo'ynimga olaman. Yuqorida keltirilgan ma'lumotlar to'g'riligiga kafolat beraman.
          </div>
        </div>
      ),
    },
    {
      id: "signatures",
      node: (
        <div className="flex justify-between mt-[40pt]">
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">
              {hasValue(joy) && hasValue(sana) ? `${joy}, ${sana}` : "Joy, Sana"}
            </div>
          </div>
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">Imzo</div>
          </div>
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">Ism, Familya</div>
          </div>
        </div>
      ),
    },
  ];
}
