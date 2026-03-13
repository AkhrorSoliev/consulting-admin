try {
    const index = require("./index");
    console.log("Successfully required index.js");
    console.log("Exports:", Object.keys(index));
} catch (e) {
    console.error("Failed to require index.js:", e);
}
