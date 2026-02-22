import { callOpenAIProxy, getMotivationModel } from "./openai";

function toText(value) {
  return String(value || "").trim();
}

function compactLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLanguages(languages) {
  if (!languages || typeof languages !== "object") return [];
  return Object.entries(languages)
    .map(([name, level]) => ({
      language: toText(name),
      level: toText(level),
    }))
    .filter((item) => item.language && item.level);
}

function normalizeExperience(experience) {
  if (!Array.isArray(experience)) return [];
  return experience
    .map((item) => ({
      position: toText(item?.position),
      company: toText(item?.company),
      location: toText(item?.location),
      startDate: toText(item?.startDate),
      endDate: toText(item?.endDate),
      responsibilities: Array.isArray(item?.responsibilities)
        ? item.responsibilities
            .map((line) => toText(line))
            .filter(Boolean)
            .slice(0, 4)
        : [],
    }))
    .filter((item) => item.position || item.company || item.responsibilities.length)
    .slice(0, 4);
}

function normalizeEducation(education) {
  if (!Array.isArray(education)) return [];
  return education
    .map((item) => ({
      institution: toText(item?.institution),
      degree: toText(item?.degree),
      startDate: toText(item?.startDate),
      endDate: toText(item?.endDate),
    }))
    .filter((item) => item.institution || item.degree)
    .slice(0, 4);
}

function buildRelevantCandidatePayload(candidateData) {
  const personalInfo = candidateData?.personalInfo || {};
  const experience = normalizeExperience(candidateData?.experience);
  const education = normalizeEducation(candidateData?.education);
  const languages = normalizeLanguages(candidateData?.skills?.languages);

  const firstPosition = experience[0]?.position || "";
  const latestDegree = education[0]?.degree || "";

  return {
    personal: {
      firstName: toText(personalInfo?.name),
      lastName: toText(personalInfo?.lastName),
      birthDate: toText(personalInfo?.birthDate),
      birthPlace: toText(personalInfo?.birthPlace),
      address: toText(personalInfo?.address),
      maritalStatus: toText(personalInfo?.maritalStatus),
    },
    targetPosition: firstPosition || latestDegree,
    education,
    experience,
    languages,
  };
}

function sanitizeLetterText(text) {
  const withoutCodeFence = String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "");

  const lines = compactLines(withoutCodeFence);
  const joined = lines.join("\n\n");

  // Keep output compact enough for one A4 page in default style.
  return joined.slice(0, 3600).trim();
}

export async function generateMotivationLetterText(candidateData, options = {}) {
  const payload = buildRelevantCandidatePayload(candidateData || {});

  const messages = [
    {
      role: "system",
      content: `Sie sind ein deutscher Fachanwalt für Migrationsrecht mit Schwerpunkt Visum-Motivationsschreiben für deutsche Auslandsvertretungen. Verfassen Sie ein offizielles, strukturiertes und überzeugendes Motivationsschreiben auf Deutsch.

Anforderungen:
- Professioneller, juristisch-seriöser Ton.
- Maximal eine A4-Seite, prägnant und substanziell.
- Keine generischen KI-Formulierungen.
- Nur Informationen aus den bereitgestellten Daten verwenden; nichts erfinden.
- Unrelevante Inhalte wie Ratings, interne Kommentare oder Dokumentlisten nicht erwähnen.
- Klare Struktur: Betreff, Anrede, Motivationskern, Qualifikationen, Integrationsabsicht, Schlussformel.
- Keine Markdown-Syntax, nur reiner Fließtext mit sinnvollen Absätzen.`,
    },
    {
      role: "user",
      content: `Erstelle das Motivationsschreiben basierend auf diesen Kandidatendaten:\n${JSON.stringify(payload, null, 2)}`,
    },
  ];

  const data = await callOpenAIProxy(messages, {
    model: String(options?.model || getMotivationModel()).trim() || getMotivationModel(),
    temperature: 0.35,
    max_tokens: 1400,
  });

  const rawText = data?.choices?.[0]?.message?.content;
  const cleaned = sanitizeLetterText(rawText);

  if (!cleaned) {
    throw new Error("No motivation letter content returned from OpenAI");
  }

  return cleaned;
}
