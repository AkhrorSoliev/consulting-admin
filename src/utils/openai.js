const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function correctCommentWithAI(htmlContent) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (!text) return { text: "", isDefault: false };

        const colonIndex = text.indexOf(":");
        if (colonIndex !== -1) {
          const beforeColon = text.substring(0, colonIndex + 1);
          const afterColon = text.substring(colonIndex + 1).trim();
          return {
            beforeColon,
            afterColon,
            isDefault: true,
          };
        }
        return { text, isDefault: false };
      }
      return null;
    };

    const extractTextParts = (element) => {
      const parts = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        const isBold =
          parent &&
          (parent.tagName === "STRONG" ||
            parent.tagName === "B" ||
            parent.style.fontWeight === "bold");
        const text = node.textContent;

        if (text.includes(":")) {
          const colonIndex = text.indexOf(":");
          const beforeColon = text.substring(0, colonIndex + 1);
          const afterColon = text.substring(colonIndex + 1);

          parts.push({
            type: "default",
            text: beforeColon,
            isBold: isBold,
          });

          if (afterColon.trim()) {
            parts.push({
              type: "editable",
              text: afterColon,
              isBold: false,
            });
          }
        } else if (isBold && !text.trim().endsWith(":")) {
          parts.push({
            type: "editable",
            text: text,
            isBold: false,
          });
        } else if (!isBold) {
          parts.push({
            type: "editable",
            text: text,
            isBold: false,
          });
        } else {
          parts.push({
            type: "default",
            text: text,
            isBold: isBold,
          });
        }
      }

      return parts;
    };

    const parts = extractTextParts(doc.body);

    const editableParts = parts.filter(
      (p) => p.type === "editable" && p.text.trim()
    );
    if (editableParts.length === 0) {
      return htmlContent;
    }

    const textToCorrect = editableParts.map((p) => p.text).join("\n---\n");

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
3. Behalte die ursprüngliche Formatierung und Struktur bei
4. Gib NUR den korrigierten/übersetzten Text zurück, ohne Erklärungen
5. Wenn mehrere Textabschnitte durch "---" getrennt sind, gib sie in der gleichen Reihenfolge zurück, auch durch "---" getrennt`,
          },
          {
            role: "user",
            content: textToCorrect,
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

    const correctedParts = correctedText.split("\n---\n");

    let editableIndex = 0;
    const reconstructedParts = parts.map((part) => {
      if (part.type === "editable" && part.text.trim()) {
        const corrected = correctedParts[editableIndex] || part.text;
        editableIndex++;
        return { ...part, text: corrected };
      }
      return part;
    });

    let result = "";
    for (let i = 0; i < reconstructedParts.length; i++) {
      const part = reconstructedParts[i];
      const prevPart = i > 0 ? reconstructedParts[i - 1] : null;

      let textToAdd = part.text;
      if (
        prevPart &&
        prevPart.type === "default" &&
        prevPart.text.endsWith(":") &&
        part.type === "editable"
      ) {
        textToAdd = " " + textToAdd.trimStart();
      }

      if (part.isBold) {
        result += `<strong>${textToAdd}</strong>`;
      } else {
        result += textToAdd;
      }
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const paragraphs = tempDiv.querySelectorAll("p");
    if (paragraphs.length > 0) {
      let currentIndex = 0;
      paragraphs.forEach((p) => {
        const pParts = extractTextParts(p);
        let pResult = "";

        for (let i = 0; i < pParts.length; i++) {
          const part = pParts[i];
          const prevPart = i > 0 ? pParts[i - 1] : null;

          if (part.type === "editable" && part.text.trim()) {
            let corrected = correctedParts[currentIndex] || part.text;
            currentIndex++;

            if (
              prevPart &&
              prevPart.type === "default" &&
              prevPart.text.endsWith(":")
            ) {
              corrected = " " + corrected.trimStart();
            }

            pResult += part.isBold
              ? `<strong>${corrected}</strong>`
              : corrected;
          } else {
            pResult += part.isBold
              ? `<strong>${part.text}</strong>`
              : part.text;
          }
        }

        p.innerHTML = pResult;
      });

      return tempDiv.innerHTML;
    }

    return result || htmlContent;
  } catch (error) {
    console.error("Error correcting comment with AI:", error);
    throw error;
  }
}
