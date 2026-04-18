# Environment variables

Every environment variable the project reads, grouped by consumer. Values marked "secret" must never be committed or exposed in the frontend bundle.

> [!WARNING]
> Anything prefixed `VITE_` ends up in the **frontend JavaScript bundle** and is visible to every visitor. Use the `VITE_` prefix only for values that are safe to expose (e.g., reCAPTCHA site key, Firebase client config).

---

## Frontend (`.env.local` in repo root)

Loaded by Vite at build/dev time. All `VITE_*` keys are bundled into the client.

### Firebase client config

Obtain from Firebase Console → Project settings → General → Your apps.

| Key | Required | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Client API key (not a secret — protected by origin restrictions) |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | `<project-id>.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | |
| `VITE_FIREBASE_APP_ID` | ✅ | |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚪ | Analytics — optional |

### Functions URLs

| Key | Required | Notes |
|---|---|---|
| `VITE_FUNCTIONS_BASE` | ✅ | `https://<region>-<project>.cloudfunctions.net` |
| `VITE_SUBMIT_CANDIDATE_URL` | ⚪ | Override for just `submitCandidate` |
| `VITE_CHECK_REGISTRY_URL` | ⚪ | Override for just `checkRegistry` |

### Public form security

| Key | Required | Notes |
|---|---|---|
| `VITE_RECAPTCHA_SITE_KEY` | ✅ | Public half of the reCAPTCHA v2 key. Google's test key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` works on `localhost` |

### PDF backend

| Key | Required | Notes |
|---|---|---|
| `VITE_PDF_BACKEND_URL` | ✅ | `http://localhost:3001` locally, deployed URL in production |

### Optional behavior flags

| Key | Default | Notes |
|---|---|---|
| `VITE_BREVO_EMAIL_URL` | (internal default) | Override Brevo bridge endpoint |
| `VITE_OPENAI_MOTIVATION_MODEL` | `gpt-4o-mini` | Model used by motivation-draft helper |
| `VITE_SNOWFALL` | `auto` | Force snowfall on/off (winter theme seasonal effect) |

---

## Cloud Functions secrets

Set via Firebase Secret Manager — **never** in `.env` files. Declared in code with `defineSecret(...)`.

```bash
cd functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

| Secret | Used by | Obtain from |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | All Telegram functions | BotFather → `/newbot` |
| `RECAPTCHA_SECRET_KEY` | `submitCandidate` | [reCAPTCHA admin console](https://www.google.com/recaptcha/admin) |
| `OPENAI_API_KEY` | `openaiProxy` | [OpenAI platform](https://platform.openai.com/api-keys) |

List configured secrets:

```bash
firebase functions:secrets:access TELEGRAM_BOT_TOKEN  # print value (careful!)
firebase functions:secrets:destroy OLD_KEY            # remove unused
```

---

## PDF backend (`backend/.env`)

| Key | Default | Notes |
|---|---|---|
| `PORT` | `3001` | HTTP port |

This service has no other configuration; it's stateless.

---

## Scripts / one-offs

Some seed / migration scripts in `functions/scripts/` may read additional keys ad-hoc from `.env` — check the specific script before running. None of these are required for normal operation.

---

## Files in this tree

| File | Purpose | Committed? |
|---|---|---|
| `.env` | Template (if present) | ⚠️ Only if empty of secrets |
| `.env.local` | **Your local values** | ❌ Never — `.gitignore`'d |
| `.env.production.local` | Prod values during local builds | ❌ Never |

`.gitignore` covers `.env` and `.env*.local`. If you ever see Firebase admin SDK JSON files (`serviceAccountKey.json`, `*-firebase-adminsdk-*.json`), they're also ignored by default — **never** commit them.

---

## Rotating a leaked secret

If a secret ever gets committed or leaked:

1. **Immediately** revoke at the source (BotFather `/revoke`, reCAPTCHA → reset key, OpenAI → delete key).
2. Generate a replacement.
3. `firebase functions:secrets:set <NAME>` with the new value.
4. `firebase deploy --only functions` to roll out.
5. Rotate the Git history if needed — the leak is public the moment it's pushed; treat every commit pushed with a secret as compromised.
