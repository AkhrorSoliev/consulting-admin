const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { getDb } = require("../utils/admin");
const { setCors, isAllowedPdfProxyUrl } = require("../utils/http");
const { verifyFirebaseIdToken, assertAdminLikeClaims } = require("../utils/auth");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.health = onRequest((req, res) => {
  logger.info("Health check called");
  res.json({
    ok: true,
    service: "consulting-admin-functions",
    time: new Date().toISOString(),
  });
});

// GET /proxyPdf?url=https://json-api.uz/mnt/file-....pdf
exports.proxyPdf = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const url = String(req.query?.url || "").trim();
    if (!isAllowedPdfProxyUrl(url)) {
      return res.status(400).json({ ok: false, error: "invalid-url" });
    }

    const upstream = await fetch(url, { method: "GET" });
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ ok: false, error: "upstream-failed", status: upstream.status });
    }

    const ct =
      upstream.headers.get("content-type") || "application/pdf; charset=binary";
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=300");

    const ab = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(ab));
  } catch (e) {
    logger.error("proxyPdf error", e);
    setCors(req, res);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: String(e?.message || e) });
  }
});

// DEBUG: Check Majors
exports.debugMajors = onRequest(async (req, res) => {
  try {
    const db = getDb();
    const snap = await db
      .collection("meta")
      .where("linkActive", "==", true)
      .get();
    const majors = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    res.json({ count: majors.length, majors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Count state_1 candidates in each direction
exports.countState1Candidates = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    const db = getDb();
    const metaSnap = await db.collection("meta").get();

    if (metaSnap.empty) {
      return res.json({ ok: false, error: "No directions found in meta" });
    }

    const results = [];
    let totalState1 = 0;

    for (const metaDoc of metaSnap.docs) {
      const metaData = metaDoc.data();
      const collectionName =
        metaData.collectionName || metaData.slug || metaDoc.id;
      const title = metaData.title || collectionName;
      const isDeleted = metaData.isDeleted === true;

      if (!collectionName) continue;

      try {
        const state1Snap = await db
          .collection(collectionName)
          .where("stepValue", "==", "stage_1")
          .get();

        const state1Count = state1Snap.size;

        const totalSnap = await db.collection(collectionName).get();
        const totalCount = totalSnap.size;

        results.push({
          collectionName,
          title,
          isDeleted,
          state1Count,
          totalCount,
        });

        totalState1 += state1Count;

        logger.info(
          `${collectionName}: state_1=${state1Count}, total=${totalCount}`,
        );
      } catch (err) {
        results.push({
          collectionName,
          title,
          isDeleted,
          error: err.message,
        });
      }
    }

    results.sort((a, b) => (b.state1Count || 0) - (a.state1Count || 0));

    return res.json({
      ok: true,
      totalDirections: metaSnap.size,
      totalState1Candidates: totalState1,
      results,
    });
  } catch (err) {
    logger.error("Error counting state_1 candidates", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /openaiProxy
exports.openaiProxy = onRequest(
  { secrets: [OPENAI_API_KEY], timeoutSeconds: 60 },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const apiKey = String(OPENAI_API_KEY.value() || "").trim();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: "openai-key-missing" });
      }

      const { messages, model, temperature, max_tokens } = req.body || {};

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, error: "missing-messages" });
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-5.2-mini",
            messages,
            temperature: temperature ?? 0.3,
            max_tokens: max_tokens ?? 2000,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("OpenAI API error", {
          status: response.status,
          errorData,
        });
        return res.status(response.status).json({
          ok: false,
          error: "openai-api-error",
          details: errorData.error?.message || response.statusText,
        });
      }

      const data = await response.json();
      return res.status(200).json({ ok: true, data });
    } catch (err) {
      logger.error("openaiProxy error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details: String(err?.message || err),
      });
    }
  },
);
