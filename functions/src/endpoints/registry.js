const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { getDb } = require("../utils/admin");
const { setCors, verifyRecaptchaV2, fetchWithTimeout, safeJson } = require("../utils/http");
const { verifyFirebaseIdToken, assertAdminLikeClaims } = require("../utils/auth");
const { enforceCheckRegistryRateLimit } = require("../utils/rateLimit");
const {
  EMAIL_AND_PASSID_COLLECTION,
  IGNORED_COLLECTIONS_FOR_REGISTRY,
  normalizeEmailForRegistry,
  normalizePassportIdForRegistry,
  extractEmailFromAnyCandidateDoc,
  extractPassportIdFromAnyCandidateDoc,
  extractTelegramIdFromAnyCandidateDoc,
  checkEmailRegistry,
  checkPassportRegistry,
  checkTelegramIdRegistry,
} = require("../utils/registry");

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const RECAPTCHA_SECRET_KEY = defineSecret("RECAPTCHA_SECRET_KEY");

const REMOTE_API_BASE = "https://json-api.uz/api/project/consultinguz";
const REMOTE_ALL_USERS = `${REMOTE_API_BASE}/all_users`;
const BREVO_EMAIL_BASE =
  process.env.BREVO_EMAIL_URL?.trim() ||
  "https://consultinguz-email-system-production.up.railway.app";
const BREVO_EMAIL_URL = `${BREVO_EMAIL_BASE.replace(/\/+$/, "").replace(/\/send-email$/, "")}/send-email`;

function findLead(meta, leadParam) {
  const list = Array.isArray(meta?.leadLinks) ? meta.leadLinks : [];
  return list.find((l) => {
    const n = String(l?.name || "").trim();
    const id = String(l?.id || l?.key || "").trim();
    return n === leadParam || id === leadParam;
  });
}

async function upsertRemoteAllUsers({ firebaseId, major, payload }) {
  const safeId = String(firebaseId || "").trim();
  const safeMajor = String(major || "").trim() || null;
  if (!safeId) throw new Error("upsertRemoteAllUsers: firebaseId missing");
  const body = {
    firebaseId: safeId,
    major: safeMajor,
    ...(payload && typeof payload === "object" ? payload : {}),
    syncedAt: Date.now(),
  };

  const TIMEOUT_MS = 8000;
  const fetchWithTimeoutLocal = (url, options) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("fetch-timeout")), TIMEOUT_MS),
      ),
    ]);
  };

  try {
    const check = await fetchWithTimeoutLocal(
      `${REMOTE_ALL_USERS}?firebaseId=${encodeURIComponent(safeId)}`,
      { method: "GET" },
      4000,
    );
    if (check.ok) {
      const json = await safeJson(check);
      const list = Array.isArray(json?.data) ? json.data : [];
      const match =
        list.find((item) => String(item?.firebaseId || "").trim() === safeId) ||
        null;
      if (match && typeof match === "object") {
        const id =
          match.id ??
          match._id ??
          match.uuid ??
          match.key ??
          match.docId ??
          null;
        if (id !== null && id !== undefined && String(id).trim() !== "") {
          const url = `${REMOTE_ALL_USERS}/${encodeURIComponent(String(id))}`;
          const put = await fetchWithTimeoutLocal(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (put.ok) return safeJson(put);
          const patch = await fetchWithTimeoutLocal(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (patch.ok) return safeJson(patch);
        }
      }
    }
  } catch (e) {
    logger.warn("upsertRemoteAllUsers: check/update failed", e);
  }

  const created = await fetchWithTimeoutLocal(REMOTE_ALL_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!created.ok) {
    throw new Error(`remote all_users POST failed: ${created.status}`);
  }
  return safeJson(created);
}

function buildCandidateSubmitConfirmationMessage(metaName) {
  const n = String(metaName || "").trim() || "-";
  return (
    "🎉 Tabriklaymiz!\n\n" +
    "✅ Sizning ma'lumotlaringiz qabul qilindi.\n" +
    `📌 Ro'yxatdan o'tgan yo'nalishingiz: ${n}\n\n` +
    "📋 Hujjatlaringiz ko'rib chiqilmoqda...\n" +
    "📞 Tez orada siz bilan aloqaga chiqamiz.\n\n" +
    "ℹ️ Eslatma:\n" +
    "1) Ushbu yo'nalish bo'yicha barcha bosqichlar yakunlanmaguncha boshqa yo'nalishga topshira olmaysiz.\n" +
    "   Barcha bosqichlar yakunlangandan so'ng esa boshqa yo'nalishga topshirishingiz mumkin bo'ladi.\n" +
    "2) Jarayon davomida bir vaqtning o'zida bir nechta ariza (bir nechta yo'nalish) topshirish mumkin emas.\n\n" +
    "Ushbu bot va @consulting_uzb kanalida qolishingizni so'raymiz."
  );
}

async function sendTelegramMessageDirect({ botToken, chatId, text }) {
  const token = String(botToken || "").trim();
  const cid = String(chatId || "").trim();
  const t = String(text || "").trim();
  if (!token || !cid || !t) {
    const e = new Error("telegram-send-invalid-args");
    e.code = "telegram-send-invalid-args";
    throw e;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cid, text: t }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await safeJson(res);
  if (!res.ok || json?.ok !== true) {
    const e = new Error("telegram-send-failed");
    e.code = "telegram-send-failed";
    e.status = 502;
    e.details = { httpStatus: res.status, telegram: json };
    throw e;
  }
  return { ok: true };
}

async function sendCandidateEmail({ to, subject, text }) {
  const mailTo = String(to || "").trim();
  const mailSubject = String(subject || "").trim();
  const mailText = String(text || "").trim();

  if (!mailTo) {
    const e = new Error("email-to-missing");
    e.code = "email-to-missing";
    e.status = 400;
    throw e;
  }
  if (!mailSubject || !mailText) {
    const e = new Error("email-content-missing");
    e.code = "email-content-missing";
    e.status = 500;
    throw e;
  }

  const response = await fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: mailTo,
      subject: mailSubject,
      message: mailText,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const e = new Error(
      `Brevo email sending failed (${response.status}): ${text || "no detail"}`,
    );
    e.code = "brevo-send-failed";
    e.status = response.status;
    throw e;
  }

  return { ok: true };
}

// POST /checkRegistry
exports.checkRegistry = onRequest(async (req, res) => {
  try {
    const { setCors } = require("../utils/http");
    setCors(req, res);
    res.set("Cache-Control", "no-store");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const rl = enforceCheckRegistryRateLimit(req, res);
    if (!rl.ok) {
      return res.status(429).json({ ok: false, error: "rate-limited" });
    }

    const emailRaw = String(req.body?.email || "").trim();
    const passportRaw = String(req.body?.passportId || "").trim();
    const telegramIdRaw = String(req.body?.telegramId || "").trim();
    if (!emailRaw && !passportRaw && !telegramIdRaw) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-email-passportId-or-telegramId" });
    }

    const out = { ok: true };

    if (emailRaw) {
      const safeEmail = normalizeEmailForRegistry(emailRaw);
      const r = await checkEmailRegistry(safeEmail);
      out.email = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    if (passportRaw) {
      const safePassport = normalizePassportIdForRegistry(passportRaw);
      const r = await checkPassportRegistry(safePassport);
      out.passport = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    if (telegramIdRaw) {
      const safeTelegramId = telegramIdRaw;
      const r = await checkTelegramIdRegistry(safeTelegramId);
      out.telegram = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    return res.json(out);
  } catch (e) {
    logger.error("checkRegistry error", e);
    const { setCors } = require("../utils/http");
    setCors(req, res);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: String(e?.message || e) });
  }
});

// Firestore trigger: keep email_and_passId in sync
exports.syncEmailAndPassIdRegistry = onDocumentWritten(
  "{collectionId}/{docId}",
  async (event) => {
    try {
      const collectionId = String(event?.params?.collectionId || "").trim();
      const docId = String(event?.params?.docId || "").trim();
      if (!collectionId || !docId) return;
      if (IGNORED_COLLECTIONS_FOR_REGISTRY.has(collectionId)) return;

      const db = getDb();
      const afterExists = Boolean(event?.data?.after?.exists);
      const beforeExists = Boolean(event?.data?.before?.exists);

      // Handle DELETE
      if (beforeExists && !afterExists) {
        const beforeData = event.data.before.data() || {};
        const emailRaw = extractEmailFromAnyCandidateDoc(beforeData);
        const safeEmail = normalizeEmailForRegistry(emailRaw);

        if (safeEmail) {
          const registryRef = db
            .collection(EMAIL_AND_PASSID_COLLECTION)
            .doc(safeEmail);

          await db.runTransaction(async (tx) => {
            const snap = await tx.get(registryRef);
            if (!snap.exists) return;

            const data = snap.data() || {};
            if (
              data.sourceMajor === collectionId &&
              data.sourceDocId === docId
            ) {
              tx.delete(registryRef);
              logger.info(
                "Deleted email_and_passId entry for deleted candidate",
                {
                  email: safeEmail,
                  major: collectionId,
                  docId: docId,
                },
              );
            }
          });
        }

        return;
      }

      // Handle CREATE/UPDATE
      if (!afterExists) return;

      const afterData = event.data.after.data() || {};
      const emailRaw = extractEmailFromAnyCandidateDoc(afterData);
      const passportRaw = extractPassportIdFromAnyCandidateDoc(afterData);
      const telegramIdRaw = extractTelegramIdFromAnyCandidateDoc(afterData);

      const safeEmail = normalizeEmailForRegistry(emailRaw);
      if (!safeEmail) return;
      const safePassport = normalizePassportIdForRegistry(passportRaw);
      const safeTelegramId = telegramIdRaw || null;

      const registryRef = db
        .collection(EMAIL_AND_PASSID_COLLECTION)
        .doc(safeEmail);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(registryRef);
        const base = {
          email: safeEmail,
          major: String(collectionId || "").trim() || null,
          sourceMajor: String(collectionId || "").trim() || null,
          sourceDocId: String(docId || "").trim() || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(safePassport ? { passportId: safePassport } : {}),
          ...(safeTelegramId ? { telegramId: safeTelegramId } : {}),
        };
        if (!snap.exists) {
          tx.set(registryRef, {
            ...base,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }
        tx.set(registryRef, base, { merge: true });
      });
    } catch (e) {
      logger.error("syncEmailAndPassIdRegistry failed", e);
    }
  },
);

// POST /submitCandidate
exports.submitCandidate = onRequest(
  {
    secrets: [RECAPTCHA_SECRET_KEY, TELEGRAM_BOT_TOKEN],
    timeoutSeconds: 120,
  },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const { major, payload } = req.body || {};
      const recaptchaToken = String(req.body?.recaptchaToken || "").trim();
      const safeMajor = String(major || "").trim();
      if (!safeMajor || !payload) {
        return res
          .status(400)
          .json({ ok: false, error: "missing-major-or-payload" });
      }

      if (!recaptchaToken) {
        return res
          .status(400)
          .json({ ok: false, error: "missing-recaptchaToken" });
      }
      const origin = String(req.get("Origin") || "").trim();
      logger.info("submitCandidate reCAPTCHA token received", {
        origin: origin || "unknown",
        tokenLen: recaptchaToken.length,
      });
      const secret = String(RECAPTCHA_SECRET_KEY.value() || "").trim();
      if (!secret) {
        return res
          .status(500)
          .json({ ok: false, error: "recaptcha-not-configured" });
      }
      const verify = await verifyRecaptchaV2({ token: recaptchaToken, secret });
      if (!verify.ok) {
        const out = {
          ok: false,
          error: "recaptcha-failed",
          reason: verify.reason,
        };
        const codes = Array.isArray(verify?.details?.["error-codes"])
          ? verify.details["error-codes"]
          : null;
        if (codes && codes.length) out.codes = codes;
        logger.warn("submitCandidate reCAPTCHA verify failed", {
          reason: verify.reason,
          codes: codes || undefined,
          origin: origin || "unknown",
          tokenLen: recaptchaToken.length,
        });
        return res.status(403).json(out);
      }

      const db = getDb();
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

      if (meta.linkActive === false) {
        return res.status(403).json({ ok: false, error: "link-inactive" });
      }

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

      const targetCol =
        meta.collectionName || meta.slug || meta.name || safeMajor || "unknown";

      const metaName =
        String(meta?.title || "").trim() ||
        String(meta?.name || "").trim() ||
        String(meta?.collectionName || "").trim() ||
        String(targetCol || "").trim() ||
        String(safeMajor || "").trim() ||
        "unknown";

      const emailFromPayload =
        payload?.persoenlicheDaten?.email ??
        payload?.personalInfo?.email ??
        payload?.email ??
        "";
      const passportFromPayload =
        payload?.passportId ??
        payload?.passportID ??
        payload?.passportNumber ??
        payload?.reisepassNummer ??
        payload?.persoenlicheDaten?.reisepassNummer ??
        payload?.personalInfo?.passportNumber ??
        "";
      const telegramIdFromPayload =
        payload?.telegramId ?? payload?.telegram_id ?? payload?.tgId ?? "";

      const safeEmail = normalizeEmailForRegistry(emailFromPayload);
      const safePassport = normalizePassportIdForRegistry(passportFromPayload);
      const safeTelegramId = String(telegramIdFromPayload || "").trim() || null;

      if (!safeEmail) {
        return res.status(400).json({ ok: false, error: "missing-email" });
      }

      const candidateRef = db.collection(targetCol).doc();
      const registryRef = db
        .collection(EMAIL_AND_PASSID_COLLECTION)
        .doc(safeEmail);
      try {
        await db.runTransaction(async (tx) => {
          const emailSnap = await tx.get(registryRef);
          if (emailSnap.exists) {
            const d = emailSnap.data() || {};
            const err = new Error("email-exists");
            err.status = 409;
            err.code = "email-exists";
            err.existing = {
              email: d.email || safeEmail,
              major: d.major || null,
            };
            throw err;
          }

          if (safePassport) {
            const q = db
              .collection(EMAIL_AND_PASSID_COLLECTION)
              .where("passportId", "==", safePassport)
              .limit(1);
            const qSnap = await tx.get(q);
            if (!qSnap.empty) {
              const d = qSnap.docs[0];
              const data = d.data() || {};
              const err = new Error("passport-exists");
              err.status = 409;
              err.code = "passport-exists";
              err.existing = {
                email: data.email || d.id || null,
                major: data.major || null,
                passportId: data.passportId || safePassport,
              };
              throw err;
            }
          }

          if (safeTelegramId) {
            const q = db
              .collection(EMAIL_AND_PASSID_COLLECTION)
              .where("telegramId", "==", safeTelegramId)
              .limit(1);
            const qSnap = await tx.get(q);
            if (!qSnap.empty) {
              const d = qSnap.docs[0];
              const data = d.data() || {};
              const err = new Error("telegram-exists");
              err.status = 409;
              err.code = "telegram-exists";
              err.existing = {
                email: data.email || d.id || null,
                major: data.major || null,
                telegramId: data.telegramId || safeTelegramId,
              };
              throw err;
            }
          }

          tx.set(candidateRef, {
            ...payload,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          tx.set(registryRef, {
            email: safeEmail,
            major: String(targetCol || "").trim() || null,
            sourceMajor: String(targetCol || "").trim() || null,
            sourceDocId: String(candidateRef.id || "").trim() || null,
            ...(safePassport ? { passportId: safePassport } : {}),
            ...(safeTelegramId ? { telegramId: safeTelegramId } : {}),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
      } catch (e) {
        const status = Number(e?.status) || 0;
        const code = String(e?.code || "");
        if (status === 409 && code === "email-exists") {
          return res.status(409).json({
            ok: false,
            error: "email-exists",
            existing: e.existing || { email: safeEmail, major: null },
          });
        }
        if (status === 409 && code === "passport-exists") {
          return res.status(409).json({
            ok: false,
            error: "passport-exists",
            existing: e.existing || {
              email: null,
              major: null,
              passportId: safePassport,
            },
          });
        }
        if (status === 409 && code === "telegram-exists") {
          return res.status(409).json({
            ok: false,
            error: "telegram-exists",
            existing: e.existing || {
              email: null,
              major: null,
              telegramId: safeTelegramId,
            },
          });
        }
        throw e;
      }

      const confirmationText =
        buildCandidateSubmitConfirmationMessage(metaName);
      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();

      const notificationTasks = [];
      if (safeTelegramId && botToken) {
        notificationTasks.push(
          sendTelegramMessageDirect({
            botToken,
            chatId: safeTelegramId,
            text: confirmationText,
          }),
        );
      }
      if (safeEmail) {
        notificationTasks.push(
          sendCandidateEmail({
            to: safeEmail,
            subject: "✅ Arizangiz qabul qilindi",
            text: confirmationText,
          }),
        );
      }

      if (notificationTasks.length) {
        const settled = await Promise.allSettled(notificationTasks);
        const failed = settled
          .map((r, idx) => ({ r, idx }))
          .filter((x) => x.r.status === "rejected")
          .map((x) => String(x.r.reason?.message || x.r.reason || ""));
        if (failed.length) {
          logger.warn("submitCandidate notifications failed", {
            id: candidateRef.id,
            major: targetCol,
            failed,
          });
        }
      }

      return res.json({ ok: true, id: candidateRef.id });
    } catch (err) {
      logger.error("submitCandidate error", err);
      setCors(req, res);
      return res
        .status(500)
        .json({ ok: false, error: "internal", details: err.message });
    }
  },
);

// Firestore trigger: sync to remote all_users
exports.syncRemoteAllUsers = onDocumentWritten(
  "{collectionId}/{docId}",
  async (event) => {
    try {
      const collectionId = String(event?.params?.collectionId || "").trim();
      const docId = String(event?.params?.docId || "").trim();
      if (!collectionId || !docId) return;
      if (IGNORED_COLLECTIONS_FOR_REGISTRY.has(collectionId)) return;

      const afterExists = Boolean(event?.data?.after?.exists);
      if (!afterExists) return;

      const afterData = event.data.after.data() || {};
      const emailRaw = extractEmailFromAnyCandidateDoc(afterData);
      const safeEmail = normalizeEmailForRegistry(emailRaw);
      if (!safeEmail) return;

      await upsertRemoteAllUsers({
        firebaseId: docId,
        major: collectionId,
        payload: afterData,
      });
    } catch (e) {
      logger.error("syncRemoteAllUsers failed", e);
    }
  },
);

