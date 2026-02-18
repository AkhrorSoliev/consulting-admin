import { auth } from "../firebase/config";

function getFunctionsBaseUrl() {
  const env = import.meta.env || {};
  const explicit = String(env.VITE_FUNCTIONS_BASE || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const submitUrlRaw = String(env.VITE_SUBMIT_CANDIDATE_URL || "").trim();
  if (submitUrlRaw) {
    try {
      const u = new URL(submitUrlRaw);
      return `${u.protocol}//${u.host}`;
    } catch {
      // ignore
    }
  }

  const projectId = String(env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net`;
  }

  throw new Error("Functions base URL not configured");
}

async function callOpenAIProxy(messages, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const baseUrl = getFunctionsBaseUrl();
  const url = `${baseUrl}/openaiProxy`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      model: options.model || "gpt-4o-mini",
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${errorData.details || errorData.error || response.statusText}`,
    );
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`OpenAI API error: ${result.details || result.error}`);
  }

  return result.data;
}

async function correctTextWithAI(text) {
  const messages = [
    {
      role: "system",
      content: `Du bist ein professioneller Übersetzer und Korrektor. Deine Aufgabe ist es:

1. Wenn der Text auf Usbekisch ist, übersetze ihn ins Deutsche (professionell und korrekt)
2. Wenn der Text auf Deutsch ist, korrigiere nur Grammatik- und Rechtschreibfehler
3. Entferne ALLE unnötigen Zeichen wie "---" oder andere Trennzeichen
4. Entferne ALLE Wiederholungen und doppelte Informationen - jede Information sollte nur EINMAL vorkommen
5. Mache den Text sauber, professionell und prägnant
6. Gib NUR den korrigierten/übersetzten Text zurück, ohne Erklärungen
7. Behalte die natürliche Struktur bei, aber entferne überflüssige Zeichen und Wiederholungen

KRITISCH - GRAMMATIK-REGELN FÜR KOMMENTARE:
- Verwende NIEMALS das Wort "Ich" oder andere erste Person Pronomen (mich, mir, mein, etc.)
- Schreibe Sätze OHNE Subjekt (unpersönlich/subjektlos)
- Verwende Infinitivkonstruktionen oder unpersönliche Formulierungen
- Beispiel FALSCH: "Ich habe die Aufgabe erledigt"
- Beispiel RICHTIG: "Aufgabe erledigt" oder "Hat die Aufgabe erledigt"
- Wenn "er" oder "sie" im Text vorkommt, füge entsprechende Personalsuffixe hinzu (-t, -te, etc.)
- Beispiel: "er arbeitet", "sie hat gearbeitet", "er ist gekommen"
- Der Text sollte wie eine objektive Notiz oder Beobachtung klingen, nicht wie eine persönliche Aussage

WICHTIG: 
- Entferne "---" und andere Trennzeichen komplett aus dem Text!
- Entferne alle wiederholten Informationen - jede Information nur EINMAL!
- NIEMALS "Ich" verwenden - dies ist absolut verboten!
- Sätze sollten subjektlos sein, es sei denn "er" oder "sie" wird verwendet`,
    },
    {
      role: "user",
      content: text,
    },
  ];

  const data = await callOpenAIProxy(messages);
  const correctedText = data.choices[0]?.message?.content?.trim();

  if (!correctedText) {
    throw new Error("No response from OpenAI");
  }

  return correctedText;
}

export async function correctCommentWithAI(htmlContent) {
  try {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const paragraphs = tempDiv.querySelectorAll("p");

    if (paragraphs.length === 0) {
      return htmlContent;
    }

    for (const p of paragraphs) {
      const childNodes = Array.from(p.childNodes);
      let newContent = "";

      for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;

          if (text.includes(":")) {
            const colonIndex = text.indexOf(":");
            const label = text.substring(0, colonIndex);
            const content = text.substring(colonIndex + 1).trim();

            newContent += `<strong>${label}:</strong> `;

            if (content) {
              const corrected = await correctTextWithAI(content);
              newContent += corrected;
            }
          } else if (text.trim()) {
            const corrected = await correctTextWithAI(text.trim());
            newContent += corrected;
          } else {
            newContent += text;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === "STRONG" || node.tagName === "B") {
            const strongText = node.textContent;

            if (strongText.includes(":")) {
              const colonIndex = strongText.indexOf(":");
              const label = strongText.substring(0, colonIndex);
              const content = strongText.substring(colonIndex + 1).trim();

              newContent += `<strong>${label}:</strong> `;

              if (content) {
                const corrected = await correctTextWithAI(content);
                newContent += corrected;
              }
            } else {
              newContent += `<strong>${strongText}</strong>`;
            }
          } else {
            newContent += node.outerHTML;
          }
        }
      }

      p.innerHTML = newContent;
    }

    return tempDiv.innerHTML;
  } catch (error) {
    console.error("Error correcting comment with AI:", error);
    throw error;
  }
}

export async function correctExperienceWithAI(
  experience,
  aufgabenOnly = false,
) {
  try {
    const { position, company, location, responsibilities } = experience;

    if (aufgabenOnly) {
      if (!responsibilities || responsibilities.length === 0) {
        throw new Error("Keine Aufgaben zum Korrigieren vorhanden.");
      }

      const context = `Position: ${position || ""}, Unternehmen: ${
        company || ""
      }, Ort: ${location || ""}`;

      const messages = [
        {
          role: "system",
          content: `Du bist ein professioneller deutscher Lebenslauf-Experte. Deine Aufgabe ist es, Aufgaben (Tätigkeiten) für einen Lebenslauf zu erstellen oder zu verbessern.

Kontext:
${context}

Anforderungen:
1. Wenn der Text auf Usbekisch ist, übersetze ihn ins Deutsche
2. Wenn der Text auf Deutsch ist:
   - Wenn die Aufgaben bereits korrekt und professionell geschrieben sind, behalte sie UNVERÄNDERT
   - Korrigiere nur, wenn es Fehler gibt oder der Text unprofessionell ist
3. Erstelle GENAU 4 professionelle Aufgabenbeschreibungen
4. Jede Aufgabe sollte aus 2 Teilen bestehen (mit Gedankenstrich getrennt)
5. Verwende professionelle deutsche Lebenslauf-Sprache
6. WICHTIG: Entferne ALLE Gedankenstriche (–), Bindestriche (-) und Punkte (•) am Anfang der Aufgaben
7. Gib die Aufgaben OHNE Aufzählungszeichen zurück
8. KRITISCH - LEBENSLAUF-FORMAT:
   - Verwende NUR Substantivierungen (Nominalisierungen) mit Verben im INFINITIV oder PARTIZIP PERFEKT
   - NIEMALS "Ich" oder andere Personalpronomen verwenden!
   - NIEMALS konjugierte Verben in erster Person verwenden!
   - Falsch: "Ich finde neue Ladungen" oder "Ich koordiniere die Einsätze"
   - Richtig: "Suche nach neuen Ladungen" oder "Koordination der Fahrereinsätze"
   - Dies ist STANDARD für deutsche Lebensläufe - KEINE Ausnahmen!
9. Mache die Aufgaben spezifisch für die Position und das Unternehmen
10. Gib NUR die 4 Aufgaben zurück, jede in einer neuen Zeile
11. KEINE Erklärungen, KEINE Nummerierung, KEINE Aufzählungszeichen

Beispiel-Format (GENAU SO):
Unterstützung bei täglichen Arbeitsabläufen – Sicherstellung eines reibungslosen Betriebsablaufs
Mitarbeit im Team – Zusammenarbeit mit Kollegen zur Erreichung gemeinsamer Ziele
Einhaltung von Arbeits- und Sicherheitsregeln – Gewährleistung eines sicheren Arbeitsumfelds
Qualitätskontrolle der Produkte – Sicherstellung hoher Qualitätsstandards`,
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
    } else {
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
          content: `Du bist ein professioneller deutscher Lebenslauf-Experte. Korrigiere und verbessere die folgenden Berufserfahrungs-Daten.

Anforderungen:
1. Wenn der Text auf Usbekisch ist, übersetze ihn ins Deutsche
2. Wenn der Text auf Deutsch ist, korrigiere Grammatik und Rechtschreibung
3. Mache die Texte professionell und prägnant
4. BEHALTE DIE GRAMMATIKALISCHE PERSON ABSOLUT UNVERÄNDERT - ändere NIEMALS von erster zu dritter Person oder umgekehrt!

5. POSITION:
   - Wenn mehrere Positionen aufgelistet sind (z.B. "Verkäufer, Lagerist"), wähle NUR EINE Position aus, die am besten zum Unternehmen passt
   - Behalte nur eine einzige, klare Berufsbezeichnung

6. ORT (SEHR WICHTIG):
   - Entferne ALLE Klammern aus dem Ort
   - Format: "[Hauptstadt/Stadt], [Land]"
   - Beispiel: "Asaka (Andijan, Usbekistan)" → "Andijan, Usbekistan"
   - Beispiel: "Qarshi, Uzbekistan" → "Qarshi Region, Usbekistan"
   - Für usbekische Städte: Verwende die Hauptstadt der Region + ", Usbekistan"
   - Für deutsche Städte: "[Stadt], Deutschland"

7. AUFGABEN (KRITISCH - LEBENSLAUF-FORMAT):
   - Wenn die Aufgaben bereits korrekt und professionell auf Deutsch geschrieben sind, behalte sie UNVERÄNDERT
   - Erstelle GENAU 4 professionelle Aufgabenbeschreibungen, jede aus 2 Teilen bestehend
   - WICHTIG: Gib die Aufgaben OHNE Gedankenstriche (–), Bindestriche (-) oder Punkte (•) am Anfang zurück
   - Jede Aufgabe sollte direkt mit dem Text beginnen
   - NIEMALS "Ich" oder Personalpronomen verwenden - nur Substantivierungen!
   - NIEMALS konjugierte Verben in erster Person ("Ich finde", "Ich koordiniere") verwenden!
   - NUR Infinitiv oder Partizip Perfekt: "Suche nach...", "Koordination von...", "Überwachung des..."

8. Gib die Daten im folgenden Format zurück:

Position: [korrigierte Position]
Unternehmen: [korrigiertes Unternehmen]
Ort: [korrigierter Ort]
Aufgaben:
[Aufgabe 1]
[Aufgabe 2]
[Aufgabe 3]
[Aufgabe 4]

Gib NUR dieses Format zurück, KEINE zusätzlichen Erklärungen.`,
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

      const lines = correctedText.split("\n");
      let newPosition = position;
      let newCompany = company;
      let newLocation = location;
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
          // Remove any leading dashes, bullets, or dots
          const cleaned = trimmed.replace(/^[–\-•]\s*/, "");
          if (cleaned.length > 0) {
            newResponsibilities.push(cleaned);
          }
        }
      }

      return {
        ...experience,
        position: newPosition,
        company: newCompany,
        location: newLocation,
        responsibilities:
          newResponsibilities.length > 0
            ? newResponsibilities
            : responsibilities,
      };
    }
  } catch (error) {
    console.error("Error correcting experience with AI:", error);
    throw error;
  }
}
