import { callOpenAIProxy } from "./proxy";
import {
  AUFGABEN_SYSTEM_PROMPT,
  FULL_CORRECTION_SYSTEM_PROMPT,
} from "./experiencePrompts";

function parseResponseLines(correctedText) {
  const lines = correctedText.split("\n");
  let newPosition = null;
  let newCompany = null;
  let newLocation = null;
  const newResponsibilities = [];

  let inAufgaben = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Position:")) {
      newPosition = trimmed.replace("Position:", "").trim();
    } else if (trimmed.startsWith("Unternehmen:")) {
      newCompany = trimmed.replace("Unternehmen:", "").trim();
    } else if (trimmed.startsWith("Ort:")) {
      newLocation = trimmed.replace("Ort:", "").trim();
    } else if (trimmed.startsWith("Aufgaben:")) {
      inAufgaben = true;
    } else if (inAufgaben && trimmed.length > 0) {
      const cleaned = trimmed.replace(/^[–\-•]\s*/, "");
      if (cleaned.length > 0) {
        newResponsibilities.push(cleaned);
      }
    }
  }

  return { newPosition, newCompany, newLocation, newResponsibilities };
}

async function correctAufgabenOnly(experience) {
  const { position, company, location, responsibilities } = experience;

  if (!responsibilities || responsibilities.length === 0) {
    throw new Error("Keine Aufgaben zum Korrigieren vorhanden.");
  }

  const context = `Position: ${position || ""}, Unternehmen: ${
    company || ""
  }, Ort: ${location || ""}`;

  const messages = [
    {
      role: "system",
      content: `${AUFGABEN_SYSTEM_PROMPT}\n\nKontext:\n${context}`,
    },
    {
      role: "user",
      content: responsibilities.join("\n"),
    },
  ];

  const data = await callOpenAIProxy(messages, {
    temperature: 0.4,
    max_tokens: 500,
  });
  const correctedText = data.choices[0]?.message?.content?.trim();

  if (!correctedText) {
    throw new Error("No response from OpenAI");
  }

  const newResponsibilities = correctedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[–\-•]\s*/, ""));

  return {
    ...experience,
    responsibilities: newResponsibilities,
  };
}

async function correctAllFields(experience) {
  const { position, company, location, responsibilities } = experience;

  const fieldsToCorrect = [];
  if (position) fieldsToCorrect.push(`Position: ${position}`);
  if (company) fieldsToCorrect.push(`Unternehmen: ${company}`);
  if (location) fieldsToCorrect.push(`Ort: ${location}`);
  if (responsibilities && responsibilities.length > 0) {
    fieldsToCorrect.push(`Aufgaben:\n${responsibilities.join("\n")}`);
  }

  if (fieldsToCorrect.length === 0) {
    throw new Error("Keine Daten zum Korrigieren vorhanden.");
  }

  const messages = [
    {
      role: "system",
      content: FULL_CORRECTION_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: fieldsToCorrect.join("\n"),
    },
  ];

  const data = await callOpenAIProxy(messages, {
    temperature: 0.4,
    max_tokens: 600,
  });
  const correctedText = data.choices[0]?.message?.content?.trim();

  if (!correctedText) {
    throw new Error("No response from OpenAI");
  }

  const { newPosition, newCompany, newLocation, newResponsibilities } =
    parseResponseLines(correctedText);

  return {
    ...experience,
    position: newPosition ?? position,
    company: newCompany ?? company,
    location: newLocation ?? location,
    responsibilities:
      newResponsibilities.length > 0 ? newResponsibilities : responsibilities,
  };
}

export async function correctExperienceWithAI(
  experience,
  aufgabenOnly = false,
) {
  try {
    if (aufgabenOnly) {
      return await correctAufgabenOnly(experience);
    } else {
      return await correctAllFields(experience);
    }
  } catch (error) {
    console.error("Error correcting experience with AI:", error);
    throw error;
  }
}
