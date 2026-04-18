# Getting started

A step-by-step walkthrough for a new developer joining the Consulting Admin project. By the end, you'll have the frontend, Cloud Functions emulator, and PDF backend running locally, and you'll have made a small verified change.

**Estimated time:** 30–45 minutes.

**Audience:** Developers who are new to this repo. Familiarity with React and the Firebase SDK is assumed; prior Firebase Admin / Functions experience helps but is not required.

---

## Prerequisites

Install these before you start:

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| npm | ships with Node | — |
| Firebase CLI | latest | `npm i -g firebase-tools` |
| Git | any recent | [git-scm.com](https://git-scm.com/) |

You also need:

- Access to the Firebase project (ask a super admin to be added as a developer).
- The `.env.local` values — ask a team lead.

---

## Step 1 — Clone and install

```bash
git clone <repo-url> consulting-admin
cd consulting-admin

# Frontend dependencies
npm install

# Cloud Functions dependencies
cd functions && npm install && cd ..

# PDF backend dependencies
cd backend && npm install && cd ..
```

---

## Step 2 — Configure environment

Create `.env.local` in the repo root with the frontend keys. The canonical list is in [../reference/environment-variables.md](../reference/environment-variables.md); a minimal working set is:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=consulting-bdb74.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=consulting-bdb74
VITE_FIREBASE_STORAGE_BUCKET=consulting-bdb74.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FUNCTIONS_BASE=https://us-central1-consulting-bdb74.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_PDF_BACKEND_URL=http://localhost:3001
```

> [!TIP]
> The `VITE_RECAPTCHA_SITE_KEY` above is Google's public test key — it always passes on `localhost`. Use the real key only in production.

Log into Firebase:

```bash
firebase login
```

---

## Step 3 — Run the stack

Open three terminals.

**Terminal 1 — frontend:**

```bash
npm run dev
```

You should see Vite serving on `http://localhost:5173`.

**Terminal 2 — PDF backend:**

```bash
cd backend
npm run dev
```

Should listen on `http://localhost:3001`. Verify with:

```bash
curl http://localhost:3001/health
# → { "ok": true }
```

**Terminal 3 — Functions emulator (optional):**

```bash
cd functions
npm run serve
```

If you skip this, the frontend will call the deployed Functions instead. That's fine for most UI work.

---

## Step 4 — Log in

1. Open `http://localhost:5173/login`.
2. Sign in with your assigned admin account.
3. You should land on `/` — the Home page showing a table of **Berufsfelder** (job fields).

If you see "access denied," your Firebase Auth account doesn't have the `role` custom claim set yet. Ask a super admin to assign one via **Settings → Admins** (see [../how-to/manage-admin-roles.md](../how-to/manage-admin-roles.md)).

---

## Step 5 — Explore the app

Click through these pages to get a mental model:

| Page | What it does |
|---|---|
| `/` | Job fields table. Click one to see its candidates. |
| `/collectionCv/pflegefachkraft` | Candidate list with filters, search, pagination. |
| `/generate/pflegefachkraft/<id>` | Full candidate editor + live CV preview + document generation. |
| `/statistics` | Live + historical metrics, Excel export. |
| `/settings/admins` | Role management (super admin only). |
| `/settings/documents` | Edit document templates with live preview. |

Replace `pflegefachkraft` with an actual major name from your project.

---

## Step 6 — Make a small change

Let's verify your setup end-to-end by changing a label.

1. Open [src/pages/Home.jsx](../../src/pages/Home.jsx).
2. Find the page heading (e.g., `Berufsfelder`) and change it to `Berufsfelder (Test)`.
3. Save. Vite HMR should reload the page automatically.
4. Confirm you see the new title at `http://localhost:5173/`.
5. Revert the change. ✅

You've verified the dev loop works.

---

## Step 7 — Understand the big picture

Before touching more code, read these two short docs:

1. [../explanation/architecture.md](../explanation/architecture.md) — how the frontend, Functions, PDF backend, and Firestore fit together.
2. [../explanation/candidate-lifecycle.md](../explanation/candidate-lifecycle.md) — how a candidate moves through the system from registration to placement.

---

## What to do next

- If you're building a feature → [../reference/project-structure.md](../reference/project-structure.md) to find the right file.
- If you're setting up a new integration → browse [../how-to/](../how-to/).
- If you're deploying → [../how-to/deploy-to-production.md](../how-to/deploy-to-production.md).

## Troubleshooting

### Vite server won't start

- Port `5173` busy: `lsof -i :5173` and kill the conflicting process, or set `PORT=5174 npm run dev`.
- Fresh clone missing modules: delete `node_modules` and re-`npm install`.

### Firebase login fails

Run `firebase login --reauth` and try again.

### "recaptcha-failed" on `/create`

The production reCAPTCHA keys don't accept `localhost`. Use the test key from step 2 or see [../how-to/setup-recaptcha.md](../how-to/setup-recaptcha.md).

### Can't see candidates

If collections look empty, your account may not have read access. Verify your `role` custom claim; catch-all Firestore reads are public, so this is usually an auth issue (not rules).
