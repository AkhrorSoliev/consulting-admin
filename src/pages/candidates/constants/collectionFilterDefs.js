import { CANDIDATE_STATUS_OPTIONS } from "../../../constants/candidateStatus";

// Static UI config for candidate list filters.
// Keep this in frontend constants unless runtime admin-edit becomes a requirement.
export const FILTER_DEFS = [
  {
    key: "certificate",
    title: "Zertifikat:",
    badgeLabel: "Zertifikat",
    column: 0,
    options: [
      { value: "all", label: "Alle" },
      { value: "with", label: "Zertifikat vorhanden" },
      { value: "without", label: "Kein Zertifikat" },
    ],
  },
  {
    key: "experience",
    title: "Erfahrung:",
    badgeLabel: "Erfahrung",
    column: 0,
    options: [
      { value: "all", label: "Alle" },
      { value: "with", label: "Erfahrung vorhanden" },
      { value: "without", label: "Keine Erfahrung" },
    ],
  },
  {
    key: "comment",
    title: "Kommentar:",
    badgeLabel: "Kommentar",
    column: 0,
    options: [
      { value: "all", label: "Alle" },
      { value: "with", label: "Kommentar vorhanden" },
      { value: "without", label: "Kein Kommentar" },
    ],
  },
  {
    key: "stage",
    title: "Stufe:",
    badgeLabel: "Stufe",
    column: 1,
    options: [
      { value: "all", label: "Alle" },
      ...CANDIDATE_STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    ],
  },
  {
    key: "stageOutcome",
    title: "Ergebnis:",
    badgeLabel: "Ergebnis",
    column: 1,
    options: [
      { value: "all", label: "Alle" },
      { value: "stage_1:accepted", label: "Stufe 1: angenommen" },
      { value: "stage_1:rejected", label: "Stufe 1: abgelehnt" },
      { value: "stage_2:accepted", label: "Stufe 2: angenommen" },
      { value: "stage_2:rejected", label: "Stufe 2: abgelehnt" },
      {
        value: "stage_2_result:accepted",
        label: "Stufe 2 Ergebnis: angenommen",
      },
      {
        value: "stage_2_result:rejected",
        label: "Stufe 2 Ergebnis: abgelehnt",
      },
      { value: "stage_3:accepted", label: "Stufe 3: angenommen" },
      { value: "stage_3:rejected", label: "Stufe 3: abgelehnt" },
      { value: "stage_4:accepted", label: "Arbeitgeber: angenommen" },
      { value: "stage_4:rejected", label: "Arbeitgeber: abgelehnt" },
    ],
  },
  {
    key: "age",
    title: "Alter:",
    badgeLabel: "Alter",
    column: 2,
    options: [
      { value: "all", label: "Alle Altersgruppen" },
      { value: "18_25", label: "18-25" },
      { value: "26_35", label: "26-35" },
      { value: "36_45", label: "36-45" },
      { value: "46_plus", label: "46+" },
    ],
  },
  {
    key: "driving",
    title: "Führerschein:",
    badgeLabel: "Führerschein",
    column: 2,
    options: [
      { value: "all", label: "Alle" },
      { value: "with", label: "Führerschein vorhanden" },
      { value: "without", label: "Kein Führerschein" },
    ],
  },
  {
    key: "langLevel",
    title: "Sprachniveau:",
    badgeLabel: "Sprache",
    column: 2,
    options: [
      { value: "all", label: "Alle" },
      { value: "A1", label: "A1" },
      { value: "A2", label: "A2" },
      { value: "B1", label: "B1" },
      { value: "B2", label: "B2" },
      { value: "C1", label: "C1" },
      { value: "C2", label: "C2" },
    ],
  },
  {
    key: "rating",
    title: "Bewertung:",
    badgeLabel: "Bewertung",
    column: 2,
    options: [
      { value: "all", label: "Alle" },
      { value: "with", label: "Mit Bewertung" },
      { value: "without", label: "Ohne Bewertung" },
    ],
  },
  {
    key: "reaction",
    title: "Reaktion:",
    badgeLabel: "Reaktion",
    column: 2,
    options: [
      { value: "all", label: "Alle" },
      { value: "like", label: "Gefällt mir" },
      { value: "dislike", label: "Gefällt mir nicht" },
    ],
  },
];
