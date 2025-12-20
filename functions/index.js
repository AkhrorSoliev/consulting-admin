const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp(); // Admin SDK bypasses security rules
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

exports.health = onRequest((req, res) => {
  logger.info("Health check called");
  res.json({
    ok: true,
    service: "consulting-admin-functions",
    time: new Date().toISOString(),
  });
});

// ---- Helper ----
function findLead(meta, leadParam) {
  const list = Array.isArray(meta?.leadLinks) ? meta.leadLinks : [];
  return list.find((l) => {
    const n = String(l?.name || "").trim();
    const id = String(l?.id || l?.key || "").trim();
    return n === leadParam || id === leadParam;
  });
}

// POST /submitCandidate
// Body: { major: string, payload: object, recaptchaToken?: string }
exports.submitCandidate = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const { major, payload } = req.body || {};
    const safeMajor = String(major || "").trim();
    if (!safeMajor || !payload) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-major-or-payload" });
    }

    // 1) Meta topish (doc id yoki collectionName bo‘yicha)
    let metaSnap = await db.collection("meta").doc(safeMajor).get();
    if (!metaSnap.exists) {
      const q = await db
        .collection("meta")
        .where("collectionName", "==", safeMajor)
        .limit(1)
        .get();
      if (!q.empty) metaSnap = q.docs[0];
    }
    if (!metaSnap.exists) {
      return res.status(404).json({ ok: false, error: "meta-not-found" });
    }
    const meta = metaSnap.data();

    // 2) Link aktyorligini tekshirish
    if (meta.linkActive === false) {
      return res.status(403).json({ ok: false, error: "link-inactive" });
    }

    // 3) Lead tekshiruvi (agar lead parametr bor bo‘lsa)
    const leadParam = String(payload?.lead || "").trim();
    if (leadParam) {
      const leadsGloballyActive = meta.leadLinksActive !== false;
      const match = findLead(meta, leadParam);
      const leadActive = match ? match?.active !== false : false;
      if (!leadsGloballyActive) {
        return res
          .status(403)
          .json({ ok: false, error: "lead-links-inactive" });
      }
      if (!match) {
        return res.status(403).json({ ok: false, error: "lead-not-found" });
      }
      if (!leadActive) {
        return res.status(403).json({ ok: false, error: "lead-inactive" });
      }
    }

    // 4) Kandidatni yozish (Admin SDK — rules cheklanmaydi)
    const targetCol =
      meta.collectionName || meta.slug || meta.name || safeMajor || "unknown";
    const candidateRef = db.collection(targetCol).doc();
    await candidateRef.set({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ ok: true, id: candidateRef.id });
  } catch (err) {
    logger.error("submitCandidate error", err);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: err.message });
  }
});
