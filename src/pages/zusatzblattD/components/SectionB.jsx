import RadioQuestion from "./RadioQuestion";

const QUESTIONS = [
  {
    name: "rbtn_4_Arbeit_90_Tage",
    label:
      "4 Die Arbeitnehmerin/Der Arbeitnehmer arbeitet insgesamt (inklusive bisheriger Beschäftigungen und der hier beantragten Beschäftigung) in Deutschland nicht mehr als 90 Tage je Zeitraum von 180 Tagen.",
  },
  {
    name: "rbtn_5_Arbeit_8_Monate",
    label:
      "5 Die Arbeitnehmerin/Der Arbeitnehmer arbeitet insgesamt (inklusive bisheriger Beschäftigungen und der hier beantragten Beschäftigung) in Deutschland nicht mehr als acht Monate innerhalb eines Zeitraumes von zwölf Monaten.",
    hint: "Hinweis: Diese Frage ist auch zu beantworten, wenn Frage 4 mit Ja beantwortet wurde. Grund hierfür ist, dass die maximale Beschäftigungsdauer von acht Monaten innerhalb eines Zeitraumes von zwölf Monaten auch für Beschäftigungen nach Frage 4 gilt.",
  },
  {
    name: "rbtn_6_Erntehelfer",
    label:
      "6 Handelt es sich um eine Beschäftigung als Erntehelferin/Erntehelfer in der Landwirtschaft?",
  },
  {
    name: "rbtn_7_Arbeit_visumfrei",
    label:
      "7 Die Arbeitnehmerin/Der Arbeitnehmer darf visumfrei zur Ausübung einer Beschäftigung einreisen (90 Tage je Zeitraum von 180 Tagen).",
    hint: "Hinweis: Staatsangehörige aus der Liste in Anhang II zur Verordnung (EU) 2018/1806 (sogenannte Positiv-Staater) können für 90 Tage innerhalb eines Zeitraums von 180 Tagen visumfrei einreisen.",
  },
  {
    name: "rbtn_8_Unternehmen_beschaeftigt",
    label:
      "8 Im Unternehmen werden in höchstens zehn Monaten innerhalb von zwölf Monaten Arbeitnehmerinnen und Arbeitnehmer auf Grundlage des § 15d BeschV beschäftigt.",
  },
  {
    name: "rbtn_9_Reisekosten",
    label:
      "9 Die erforderlichen Reisekosten für Hin- und Rückreise werden von dem Arbeitgeber übernommen.",
  },
];

export default function SectionB({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        B. Angaben zur kurzfristigen Beschäftigung
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
        {QUESTIONS.map((q) => (
          <RadioQuestion
            key={q.name}
            name={q.name}
            label={q.label}
            hint={q.hint}
            value={form[q.name]}
            onChange={(opt) => setForm((p) => ({ ...p, [q.name]: opt }))}
          />
        ))}
      </div>
    </>
  );
}
