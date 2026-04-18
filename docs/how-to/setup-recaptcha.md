# How to set up reCAPTCHA

This guide walks you through configuring Google reCAPTCHA v2 for the public `/create` candidate registration flow.

**You need this when:** you're setting up a new environment, rotating a leaked key, or fixing the `recaptcha-failed` / `403 Forbidden` error on `/create` submit.

---

## Step 1 — Register a reCAPTCHA site

1. Open [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
2. Click **Register a new site**.
3. Fill in:
   - **Label:** `consulting-admin` (or your environment name)
   - **reCAPTCHA type:** reCAPTCHA v2 → **"I'm not a robot" Checkbox**
   - **Domains:**
     ```
     localhost
     127.0.0.1
     admin.consultinguz.de
     <your-production-domain>
     ```
4. Submit and copy both the **Site Key** and the **Secret Key**.

> [!WARNING]
> The Secret Key is a server-side secret. Never put it in `.env.local` or ship it to the client. Only the Site Key is safe for the frontend.

---

## Step 2 — Configure the frontend

Add the Site Key to your `.env.local` in the repo root:

```bash
VITE_RECAPTCHA_SITE_KEY=<your-site-key>
```

Restart Vite to pick up the new env var:

```bash
npm run dev
```

---

## Step 3 — Configure the Cloud Function secret

The `submitCandidate` function verifies tokens against Google using `RECAPTCHA_SECRET_KEY`. Set it:

```bash
cd functions
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
```

When prompted, paste the **Secret Key** from step 1 and press Enter.

---

## Step 4 — Deploy the function

```bash
firebase deploy --only functions:submitCandidate
```

This is required so the function picks up the new secret value.

---

## Step 5 — Verify end-to-end

1. Open `/create?linkId=<any-valid-link>` in a browser.
2. Fill the form far enough to hit the reCAPTCHA checkbox.
3. Click the checkbox and submit.
4. You should see the Thank You confetti. If you see `recaptcha-failed` / `403`, jump to [Troubleshooting](#troubleshooting).

---

## Using Google's test keys for local development

Google publishes public test keys that always pass on `localhost`. Use these if you don't want to configure real keys for dev:

```bash
# Frontend (.env.local)
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# Functions secret
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
# Enter: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

These keys only work on `localhost` / `127.0.0.1` and always return success — do not use in production.

---

## Troubleshooting

### `403 recaptcha-failed`

The token failed server-side verification. Common causes:

- **Site Key and Secret Key are from different reCAPTCHA sites.** They must be from the same registered site.
- **Domain mismatch.** The domain you're on isn't in the reCAPTCHA site's domain list. Add it in the admin console and wait a minute.
- **Secret not deployed.** After `firebase functions:secrets:set`, you must `firebase deploy --only functions:submitCandidate` for the function to pick it up.

Check Function logs:

```bash
firebase functions:log --only submitCandidate
```

### `500 recaptcha-not-configured`

The secret isn't set at all. Run step 3 + step 4.

### Checkbox doesn't appear on the form

- `VITE_RECAPTCHA_SITE_KEY` missing in `.env.local` — the component hides itself when unset.
- Vite dev server wasn't restarted after editing `.env.local`.

### CORS error on submit

The Function's `allowedOrigins` list doesn't include your origin. Add your dev domain to the list in `functions/index.js` (search for `allowedOrigins`).

---

## Rotating a leaked secret

If the Secret Key ever leaks (committed to git, posted in chat, included in logs):

1. In the [reCAPTCHA admin console](https://www.google.com/recaptcha/admin), open the site and click **Settings → Reset Secret Key**.
2. Copy the new secret.
3. `firebase functions:secrets:set RECAPTCHA_SECRET_KEY` → paste new value.
4. `firebase deploy --only functions:submitCandidate`.
5. (Optional) Also reset the Site Key and update `.env.local` + redeploy frontend, if you want to fully invalidate any cached tokens. Usually not necessary.

---

## Temporarily bypassing reCAPTCHA in development

> [!CAUTION]
> Only do this on local-only development. Never deploy with reCAPTCHA disabled.

If you absolutely need to bypass the check locally, comment out the token check in `functions/index.js` around the `submitCandidate` handler:

```javascript
// if (!recaptchaToken) return res.status(400).json({ ok: false, error: "missing-recaptchaToken" });
// const verify = await verifyRecaptchaV2({ token: recaptchaToken, remoteIp, secret });
// if (!verify.ok) return res.status(403).json({ ok: false, error: "recaptcha-failed" });
```

Deploy only to the emulator — never to production. Revert before committing.
