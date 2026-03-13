import SafeInline from "./SafeInline";

function hasValue(v) {
  return String(v || "").trim().length > 0;
}

function P({ children, className = "" }) {
  return <div className={`mt-[8pt] ${className}`}>{children}</div>;
}

function FormRow({ label, value }) {
  return (
    <div className="flex gap-[6pt] mt-[10pt]">
      <div className="w-[120px] shrink-0">{label}:</div>
      {hasValue(value) ? (
        <div className="flex-1 min-h-[16pt]">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-slate-700 min-h-[16pt]" />
      )}
    </div>
  );
}

function Bullet({ children }) {
  return (
    <div className="flex gap-[6pt] mt-[4pt]">
      <span className="shrink-0">•</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );
}

export default function buildVollmachtBlocks({
  lastName,
  firstName,
  birthDate,
  city,
  date,
}) {
  const lastNameLine = String(lastName || "").trim();
  const firstNameLine = String(firstName || "").trim();
  const birthDateLine = String(birthDate || "").trim();
  const cityLine = String(city || "").trim();
  const dateLine = String(date || "").trim();

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold">Vollmacht</div>
        </div>
      ),
    },
    {
      id: "intro",
      keepWithNext: true,
      node: (
        <div>
          <P>Hiermit bevollmächtige ich</P>

          <div className="ml-5 mt-[8pt]">
            <FormRow label="Nachname" value={lastNameLine} />
            <FormRow label="Vorname" value={firstNameLine} />
            <FormRow label="geboren am" value={birthDateLine} />
          </div>

          <P className="mt-[16pt]">den Vollmachtnehmer</P>

          <P className="font-bold mt-[8pt]">
            Orif Akhmadaliev, (ConsultingUz), Alemannenweg 6, 72488 Sigmaringen
          </P>

          <P className="mt-[12pt]">
            mich zu unterstützen und zu vertreten in der Angelegenheit Erlangung
            und Antritt einer Fachkraft in Deutschland.
          </P>

          <P className="mt-[12pt]">Die Vollmacht umfasst insbesondere</P>
        </div>
      ),
    },
    {
      id: "list",
      node: (
        <div className="ml-3">
          <div className="mt-[8pt]">
            <Bullet>
              die Vertretung bei allen erforderlichen Maßnahmen gegenüber
              Behörden und Intuitionen, um eine Fachkraft in Deutschland
              antreten zu können,
            </Bullet>
            <Bullet>die Einholung von beglaubigten Übersetzungen,</Bullet>
            <Bullet>
              die Versendung und Entgegennahme von Schriftstücken sowie die
              Abgabe und Entgegennahme von mündlichen Erklärungen im Rahmen der
              vorgenannten Tätigkeiten ist ausdrücklich eingeschlossen.
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-[32pt]">
          <div className="ml-5">
            <FormRow label="Wohnort" value={cityLine} />
            <FormRow label="Datum" value={dateLine} />

            <div className="flex gap-[6pt] mt-[20pt]">
              <div className="w-[120px] shrink-0">Unterschrift:</div>
              <div className="flex-1 border-b border-slate-700 min-h-[20pt]" />
            </div>
          </div>
        </div>
      ),
    },
  ];
}
