// Test script to check how Telegram bot parses deep link payloads

const testPayload = "straßenbau-ausbildung-2026__lead__2020";

console.log("Testing payload parsing:");
console.log("Original payload:", testPayload);
console.log("Payload length:", testPayload.length);
console.log("Payload byte length:", Buffer.byteLength(testPayload, "utf8"));

// Test URL encoding
const encoded = encodeURIComponent(testPayload);
console.log("\nURL encoded:", encoded);
console.log("Encoded length:", encoded.length);

// Test decoding
const decoded = decodeURIComponent(encoded);
console.log("\nDecoded:", decoded);
console.log("Matches original:", decoded === testPayload);

// Test message text parsing
const messageText = `/start ${testPayload}`;
console.log("\nMessage text:", messageText);

const match = messageText.match(/^\/start\s+(.+)$/);
if (match && match[1]) {
  const parsed = match[1].trim();
  console.log("Parsed from regex:", parsed);
  console.log("Matches original:", parsed === testPayload);
}

// Test splitting
const parts = testPayload.split("__lead__");
console.log("\nSplit by '__lead__':");
console.log("Major:", parts[0]);
console.log("Lead:", parts[1]);
