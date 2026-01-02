const functions = require("firebase-functions");
const fetch = require("node-fetch");

/**
 * Cloud Function to proxy file downloads with proper Content-Disposition header
 * This bypasses CORS issues and forces browser to download with correct filename
 *
 * Usage: GET /downloadProxy?url=<file_url>&filename=<filename>
 */
exports.downloadProxy = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { url, filename } = req.query;

    if (!url) {
      res.status(400).json({ error: "URL parameter is required" });
      return;
    }

    console.log("Proxying download:", { url, filename });

    // Fetch the file from the original URL
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        "Failed to fetch file:",
        response.status,
        response.statusText
      );
      res.status(response.status).json({
        error: "Failed to fetch file",
        status: response.status,
      });
      return;
    }

    // Get the file buffer
    const buffer = await response.buffer();

    // Set headers to force download with correct filename
    const safeFilename = filename || "document.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    res.setHeader("Content-Length", buffer.length);

    // Send the file
    res.send(buffer);

    console.log("Download proxied successfully:", safeFilename);
  } catch (error) {
    console.error("Download proxy error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});
