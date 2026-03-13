import { callOpenAIProxy } from "./proxy";

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
