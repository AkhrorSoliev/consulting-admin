export default function PersonalfragebogenLivePreview({ form }) {
  const nachname = String(form?.nachname || "").trim();
  const vorname = String(form?.vorname || "").trim();
  const wohnadresseDeutschland = String(form?.wohnadresseDeutschland || "").trim();
  const wohnadresseUsbekistan = String(form?.wohnadresseUsbekistan || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const geschlecht = String(form?.geschlecht || "").trim();
  const staatsangehoerigkeit = String(form?.staatsangehoerigkeit || "usbekisch").trim();
  const schuhgroesse = String(form?.schuhgroesse || "").trim();
  const kleidergroesse = String(form?.kleidergroesse || "").trim();
  const steueridentifikationsnummer = String(form?.steueridentifikationsnummer || "").trim();
  const krankenversicherung = String(form?.krankenversicherung || "").trim();
  const bankName = String(form?.bankName || "").trim();
  const iban = String(form?.iban || "").trim();
  const bic = String(form?.bic || "").trim();
  const visaArt = String(form?.visaArt || "").trim();
  const visaNummer = String(form?.visaNummer || "").trim();
  const visaGueltigkeit = String(form?.visaGueltigkeit || "").trim();
  const datum = String(form?.datum || "").trim();

  const previewClass =
    "flex-1 bg-white rounded-2xl shadow-2xl border border-base-300 p-6 lg:p-8 min-h-[700px] print:shadow-none print:border-none print:p-0 overflow-y-auto";

  const TableRow = ({ label, labelSub, value, isLast }) => (
    <div className={`flex ${!isLast ? "border-b border-black" : ""}`}>
      <div className="w-[40%] p-2 border-r border-black">
        <div className="text-[9px] font-semibold">{label}</div>
        {labelSub && <div className="text-[7px] text-gray-500 italic">{labelSub}</div>}
      </div>
      <div className="w-[60%] p-2">
        <div className="text-[9px]">{value}</div>
      </div>
    </div>
  );

  return (
    <section className={previewClass}>
      <div className="max-w-[650px] mx-auto text-slate-900 leading-tight text-[9px]">
        {/* Header with logo */}
        <div className="flex justify-end mb-2">
          <img src="/consultinguz.png" alt="ConsultingUZ" className="h-10 object-contain" />
        </div>

        {/* Title */}
        <h1 className="text-base font-bold mb-1">PERSONALFRAGEBOGEN</h1>
        <p className="text-[8px] text-gray-700 mb-0.5">
          Dieser Personalfragebogen dient zur Vorerfassung von Personaldaten, die für die Arbeitgeber in Deutschland relevant sind.
        </p>
        <p className="text-[7px] text-gray-500 italic">
          / (Ushbu ishchi haqidagi ma'lumotnoma ish beruvchiga zarur bo'lgan ma'lumotlarni yig'ish uchun qo'llaniladi)
        </p>

        {/* Persönliche Angaben */}
        <div className="flex items-baseline mt-3 mb-1">
          <span className="text-[10px] font-bold">Persönliche Angaben / </span>
          <span className="text-[8px] text-gray-500">(Shaxsiy ma'lumotlar)</span>
        </div>

        <div className="border border-black">
          <TableRow label="Nachname" labelSub="(Familiyangiz)" value={nachname} />
          <TableRow label="Vorname" labelSub="(Ismingiz)" value={vorname} />
          <TableRow label="Wohnadresse in Deutschland" labelSub="(Germaniyaga kelgandan so'ng yashash manzilingiz)" value={wohnadresseDeutschland} />
          <TableRow label="Wohnadresse in Usbekistan" labelSub="(O'zbekistondagi yashash manzilingiz)" value={wohnadresseUsbekistan} />
          <TableRow label="Geburtsdatum" labelSub="(Tug'ilgan sanangiz)" value={geburtsdatum} />
          <TableRow label="Geburtsort" labelSub="(Tug'ilgan joyingiz)" value={geburtsort} />
          <TableRow label="Geschlecht" labelSub="(Jinsingiz)" value={geschlecht} />
          <TableRow label="Staatsangehörigkeit" labelSub="(qaysi davlat fuqarosi)" value={staatsangehoerigkeit} />
          <TableRow label="Schuhgröße" labelSub="(oyoq kiyim razmeriz)" value={schuhgroesse} />
          <TableRow label="Kleidergröße" labelSub="(Kiyim razmeriz)" value={kleidergroesse} isLast />
        </div>

        {/* Steuer */}
        <div className="flex items-baseline mt-3 mb-1">
          <span className="text-[10px] font-bold">Steuer / </span>
          <span className="text-[8px] text-gray-500">(Soliq tizimi bo'yicha ma'lumotlar)</span>
        </div>

        <div className="border border-black">
          <TableRow 
            label="Steueridentifikationsnummer" 
            labelSub="(Agar bundan oldin Germaniyaga kelgan bo'lsangiz, sizga berilgan soliq nomeringiz)" 
            value={steueridentifikationsnummer} 
            isLast 
          />
        </div>

        {/* Krankenversicherung */}
        <div className="flex items-baseline mt-3 mb-1">
          <span className="text-[10px] font-bold">Krankenversicherung / </span>
          <span className="text-[8px] text-gray-500">(Tibbiyot sug'urtasi)</span>
        </div>

        <div className="border border-black">
          <TableRow 
            label="Krankenversicherung" 
            labelSub="(Tibbiyot sug'urtasi nomi va raqami)" 
            value={krankenversicherung} 
            isLast 
          />
        </div>

        {/* Bankdaten */}
        <div className="flex items-baseline mt-3 mb-1">
          <span className="text-[10px] font-bold">Bankdaten / </span>
          <span className="text-[8px] text-gray-500">(Germaniyadagi bank hisobn raqami haqida ma'lumotlar)</span>
        </div>

        <div className="border border-black">
          <TableRow label={<>Name der Bank <span className="font-normal text-gray-500 italic">(Bank nomi)</span></>} value={bankName} />
          <TableRow label={<>IBAN <span className="font-normal text-gray-500 italic">(IBAN nomeri)</span></>} value={iban} />
          <TableRow label={<>BIC <span className="font-normal text-gray-500 italic">(BIC nomeri)</span></>} value={bic} isLast />
        </div>

        {/* Visadaten */}
        <div className="flex items-baseline mt-3 mb-1">
          <span className="text-[10px] font-bold">Visadaten / </span>
          <span className="text-[8px] text-gray-500">(Viza ma'lumotlari)</span>
        </div>

        <div className="border border-black">
          <TableRow label={<>Art des Visums <span className="font-normal text-gray-500 italic">(viza turi)</span></>} value={visaArt} />
          <TableRow label={<>Nummer des Visums <span className="font-normal text-gray-500 italic">(viza nomeri)</span></>} value={visaNummer} />
          <TableRow label="Gültigkeit des Visums (mit Datum)" labelSub="(vizaning amal qilish sanasi)" value={visaGueltigkeit} isLast />
        </div>

        {/* Erklärung */}
        <p className="mt-3 text-[7px] text-justify leading-snug">
          <span className="font-bold">Erklärung des Arbeitnehmers: </span>
          Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen. Ich verpflichte mich, meinem Arbeitgeber alle Änderungen, insbesondere in Bezug auf weitere Beschäftigungen (in Bezug auf Art, Dauer und Entgelt), unverzüglich mitzuteilen. Bei Zuwiderhandlungen (z.B. Falschaussagen) ist mir bekannt, dass der Arbeitgeber mir gegenüber Schadensersatzansprüche geltend machen kann und wird.{" "}
          <span className="italic text-gray-500">
            (Ishchining tasdiqlashi: Yuqorida berilgan barcha ma'lumotlar to'g'riligga kafolat beraman va ushbu ma'lumotlar shaxsan o'zim tarafdan to'ldirilganini ham tasdiqlayman. Noto'g'ri ma'lumotlar berilgani uchun javobgarlik borligidan ma'lumotim mavjud)
          </span>
        </p>

        {/* Signature Section */}
        <div className="flex justify-between mt-8">
          <div className="w-[40%]">
            <p className="text-[9px]">{datum}</p>
            <div className="border-t border-black mt-8 pt-1">
              <p className="text-[8px] text-gray-500">Datum (Sana)</p>
            </div>
          </div>
          <div className="w-[40%]">
            <div className="border-t border-black mt-8 pt-1">
              <p className="text-[8px] text-gray-500">Unterschrift Arbeitnehmer (Ishchining imzosi)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
