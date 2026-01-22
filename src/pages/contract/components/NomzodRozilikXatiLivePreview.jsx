import { useMemo } from "react";

export default function NomzodRozilikXatiLivePreview({ form }) {
  const sana = String(form?.sana || "").trim();
  const nomzodIsmFamilya = String(form?.nomzodIsmFamilya || "").trim();
  const ishBeruvchiNomi = String(form?.ishBeruvchiNomi || "").trim();
  const kasb = String(form?.kasb || "").trim();
  const dasturSana = String(form?.dasturSana || "").trim();
  const oyNomi = String(form?.oyNomi || "").trim();

  const previewClass =
    "flex-1 bg-white rounded-2xl shadow-2xl border border-base-300 p-8 lg:p-12 min-h-[700px] print:shadow-none print:border-none print:p-0";

  return (
    <section className={previewClass}>
      <div className="max-w-[600px] mx-auto text-slate-900 leading-relaxed">
        {/* Title */}
        <h1 className="text-xl font-bold text-center text-blue-600 underline mb-8">
          Rozilik xati
        </h1>

        {/* Date */}
        <p className="text-right mb-8">Sana: {sana || "DD.MM.YYYY"}</p>

        {/* Main paragraph */}
        <p className="text-justify mb-4 indent-10">
          Men{" "}
          <span className="font-semibold">
            {nomzodIsmFamilya || "kondidat-ism-familyasi"}
          </span>
          ,{" "}
          <span className="font-semibold">
            {ishBeruvchiNomi || "ish-beruvchi-nomi"}
          </span>{" "}
          kompaniyasi tomonidan taklif etilgan{" "}
          <span className="font-semibold">
            {kasb || "Fachkraft für Lagerlogistik"}
          </span>{" "}
          yo'nalishida{" "}
          <span className="font-semibold">{dasturSana || "SANA"}</span>{" "}
          <span className="font-semibold">{oyNomi || "OYNOMI"}</span> oyidan
          boshlanuvchi dastur-nomi rozilik beraman va ushbu sanagacha barcha
          hujjat ishlarida ConsultingUz (Orif Akhmadaliev) jamoasini
          qo'llab-quvvatlayman hamda tayyorlov kurslarida faol qatnashib
          boraman.
        </p>

        <p className="text-justify mb-8 indent-10">
          Ushbu qarorimni albatta uyimdagi ota-onam bilan maslahatlashgan holda
          qildim.
        </p>

        {/* Signature section */}
        <div className="mt-12">
          <p className="mb-2">Hurmat bilan</p>
          <p className="mb-8">
            {nomzodIsmFamilya || "kondidat-ism-familyasi"}
          </p>

          <div className="flex items-end gap-2 mt-8">
            <span className="font-semibold">IMZO:</span>
          </div>
        </div>
      </div>
    </section>
  );
}
