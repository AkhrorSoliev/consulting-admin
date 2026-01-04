const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function correctTextWithAI(text) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Du bist ein professioneller Übersetzer und Korrektor. Deine Aufgabe ist es:

1. Wenn der Text auf Usbekisch ist, übersetze ihn ins Deutsche (professionell und korrekt)
2. Wenn der Text auf Deutsch ist, korrigiere nur Grammatik- und Rechtschreibfehler
3. Entferne ALLE unnötigen Zeichen wie "---" oder andere Trennzeichen
4. Mache den Text sauber und professionell
5. Gib NUR den korrigierten/übersetzten Text zurück, ohne Erklärungen
6. Behalte die natürliche Struktur bei, aber entferne überflüssige Zeichen

WICHTIG: Entferne "---" und andere Trennzeichen komplett aus dem Text!`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `OpenAI API error: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
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

            newContent += `<strong>${label}:</strong>`;

            if (content) {
              const corrected = await correctTextWithAI(content);
              newContent += " " + corrected;
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

              newContent += `<strong>${label}:</strong>`;

              if (content) {
                const corrected = await correctTextWithAI(content);
                newContent += " " + corrected;
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
