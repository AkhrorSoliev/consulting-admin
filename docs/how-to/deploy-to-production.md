# How to deploy to production

Roll out changes to the three deployable surfaces: frontend, Cloud Functions, and PDF backend.

**You need this when:** shipping a change. Read the whole runbook before the first time — the order matters.

**Pre-flight:** all tests / lint pass locally, env vars are set, you're on a merged-to-main commit.

---

## Quick summary

```bash
# Frontend (static hosting)
npm run build
firebase deploy --only hosting

# Cloud Functions (incremental)
cd functions
firebase deploy --only functions

# PDF backend (separate service)
cd ../backend
# Deploy per your setup (Cloud Run / VM / Railway / …)
```

Deploy surfaces are independent — you usually deploy just what changed.

---

## Order of operations

If your change spans multiple surfaces, deploy in this order:

1. **PDF backend first** — if a frontend change depends on new backend routes.
2. **Functions** — if the frontend calls new functions or relies on new secrets.
3. **Frontend last** — consumers of Functions/backend routes are deployed after those are available.

This prevents the frontend from breaking when it tries to call something the backend doesn't know yet.

---

## Frontend (Firebase Hosting)

### Build

```bash
npm run build
```

Output lands in `dist/`. Check `dist/index.html` exists and file sizes look reasonable (compare to a previous deploy if unsure).

### Deploy

```bash
firebase deploy --only hosting
```

Firebase prints the deployed URL. Verify:

- Open the URL in an incognito window.
- Hit a protected page → redirects to `/login`.
- Log in → lands on `/`.
- Open `/statistics` → counts render.
- Open `/create?linkId=<known-good>` → form renders.

### Vercel (alternative)

If deploying to Vercel (`vercel.json` is present):

```bash
vercel --prod
```

Vercel reads environment variables from its dashboard — make sure they match `.env.local`.

---

## Cloud Functions

### Deploy all

```bash
cd functions
firebase deploy --only functions
```

### Deploy one function

```bash
firebase deploy --only functions:submitCandidate
```

This is **much faster** when you've only touched one handler. Prefer it over a full deploy during a hotfix.

### Secrets

Secrets are **not** deployed automatically. Changes to secret values require:

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN   # pick it up
firebase deploy --only functions                     # make it live
```

If you skip the redeploy, Functions will use the old secret until next deploy.

### Verify

```bash
# Health check
curl https://us-central1-<PROJECT>.cloudfunctions.net/health
# → { "ok": true }

# Tail logs for the next few minutes
firebase functions:log --only submitCandidate,checkRegistry,telegramBotWebhook
```

Watch for cold-start errors, missing secrets, etc.

---

## PDF backend

The PDF backend deploys separately — it is **not** a Firebase Function. Deploy depends on your infra choice.

### Generic steps

```bash
cd backend
# Build if needed
npm ci
# Deploy by your method:
#   - gcloud run deploy ...
#   - docker push + apply manifest
#   - scp + systemctl restart
#   - Vercel serverless (less recommended — cold starts hurt)
```

### Verify

```bash
curl <pdf-backend-url>/health
# → { "ok": true }

curl <pdf-backend-url>/templates
# → list of template PDF filenames
```

### PDF template changes

Templates in `backend/pdf/` are read from the filesystem. Any new or changed PDF requires a backend redeploy — this is why changes to the `backend/` pipeline templates are slower to ship than client-side ones.

---

## Firestore rules & indexes

Rules and indexes are versioned separately:

```bash
# Rules only
firebase deploy --only firestore:rules

# Indexes only
firebase deploy --only firestore:indexes

# Storage rules
firebase deploy --only storage
```

Rule deploys are essentially instant and atomic. Index builds can take minutes — Firebase emails when they finish.

---

## Rollback

### Frontend

```bash
firebase hosting:clone <site>:<channel> <site>:live
# or from Firebase Console: Hosting → Release history → "Rollback" on an older entry
```

Vercel has a similar one-click rollback in its dashboard.

### Cloud Functions

No built-in rollback. To revert:

1. `git checkout <previous-commit>`
2. `cd functions && firebase deploy --only functions`

### PDF backend

Roll back via your deploy tool's snapshot/previous-revision mechanism (e.g., `gcloud run services update-traffic --to-revisions=<prev>=100`).

---

## Smoke test checklist

After any deploy, run through this:

- [ ] Sign in as admin
- [ ] Open `/` — job fields table renders with counts
- [ ] Open a candidate list — candidates render with filters
- [ ] Open a candidate → CV preview renders
- [ ] Generate a document → PDF previews and downloads
- [ ] Send a test Telegram message (if Telegram changes)
- [ ] Submit a test candidate at `/create` (on a dev major)

If any step fails, stop and investigate before announcing the deploy.

---

## Common issues

### Functions deploy fails with `SECRET_XXX not found`

You reference a secret that hasn't been set. Run `firebase functions:secrets:set XXX` and retry.

### Functions deploy is slow (5+ min)

Normal for the first deploy after a dependency change. Subsequent deploys of unchanged functions are near-instant.

### Hosting deploy succeeds but old content still served

CDN caching. Hard-refresh (Cmd+Shift+R). Firebase Hosting cache-busts `index.html` by default, so content updates pick up on the next load.

### `/create` works locally but fails in production

Likely: `VITE_RECAPTCHA_SITE_KEY` or `RECAPTCHA_SECRET_KEY` mismatch for the production domain. See [setup-recaptcha.md](setup-recaptcha.md).

---

## Pre-deploy checklist

Before starting a deploy:

- [ ] Main branch is up to date with your changes
- [ ] Lint passes: `npm run lint`
- [ ] `npm run build` succeeds locally
- [ ] For Functions changes: `cd functions && npm run lint` passes
- [ ] Secrets for new integrations have been set
- [ ] If changing rules, reviewed by at least one other engineer
- [ ] Announced in team channel that a deploy is starting

---

## See also

- [../reference/environment-variables.md](../reference/environment-variables.md) — what needs to be configured
- [../reference/cloud-functions.md](../reference/cloud-functions.md) — function-by-function reference
- [setup-recaptcha.md](setup-recaptcha.md) — when reCAPTCHA stops working after deploy
