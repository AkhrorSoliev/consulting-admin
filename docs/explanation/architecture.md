# Architecture

Understanding how the parts of Consulting Admin fit together: what runs where, how trust flows, and why the design turned out this way.

---

## 1. The big picture

The system is a browser SPA backed by Firebase, with two auxiliary services for PDF work and bot integrations.

```
┌───────────────────────┐
│  React SPA (Vite)     │  browser
│  src/                 │
└────────┬──────────────┘
         │ Firebase SDK (Auth, Firestore, Storage)
         │ fetch() to Functions HTTPS
         │ fetch() to PDF backend
         ▼
┌───────────────────────────────────────────────┐
│  Firebase                                     │
│  ├── Auth         (custom claim: role)        │
│  ├── Firestore    (application data)          │
│  ├── Storage      (PDFs, photos)              │
│  └── Cloud Functions v2 (functions/)          │
│         ├── HTTP endpoints                    │
│         ├── Callables                         │
│         └── Firestore triggers                │
└────────┬──────────────────────────────────────┘
         │
         ├────► Express PDF backend (backend/)      [fillable PDF templates]
         ├────► Telegram Bot API                    [invites, removals, webhook]
         ├────► OpenAI (proxied via Functions)      [motivation drafting]
         ├────► Brevo bridge                        [email delivery]
         └────► json-api.uz                         [remote mirror for candidates]
```

---

## 2. Runtime boundaries

### Frontend (`src/`)

A single React 19 SPA built with Vite. Routing lives in [src/App.jsx](../../src/App.jsx); access control is enforced by `ProtectedRoutes` + a desktop-only guard for admin surfaces. The `/create` and `/dataExchange/:id` routes are public and link-gated (the app serves them only if the caller has a valid `linkId` or candidate id in the URL).

Key patterns:

- **Firestore as state store.** Most pages subscribe to Firestore with `onSnapshot` and render directly from snapshots. Redux holds only auth state.
- **Feature-sliced pages.** Each complex page (especially `src/pages/generate/` and `src/pages/create/`) is split into `hooks/`, `sections/`, `modals/`, and `components/` to keep files under the 200-line budget defined in [`CLAUDE.md`](../../CLAUDE.md).
- **Client-side PDF generation.** CVs and most contracts are produced in-browser via `@react-pdf/renderer`, so no round-trip is needed.

### Firebase Cloud Functions (`functions/`)

Node 20, Functions v2. This is the primary backend — every trusted mutation, integration, and duplicate-protection check runs here.

Three categories of function:

1. **HTTP endpoints** — admin-only (`generateInvite`, `sendTelegramMessage`, …) and public (`submitCandidate`, `checkRegistry`, `downloadProxy`).
2. **Callables** — super-admin-only user management (`createUser`, `setUserRole`, …).
3. **Triggers** — `syncEmailAndPassIdRegistry` keeps the duplicate registry consistent; `syncRemoteAllUsers` mirrors candidate data to `json-api.uz`.

Secrets (Telegram token, reCAPTCHA secret, OpenAI key) are declared with `defineSecret`, never committed.

### PDF backend (`backend/`)

A standalone Express service. It exists for one reason: **fillable PDF templates** (e.g., Zusatzblatt A–D, Erklärung Beschäftigung) need `pdf-lib`'s form-field manipulation, which we didn't want to ship with the frontend bundle. Every other PDF is generated client-side.

It's stateless and deploys independently. The frontend calls it via `VITE_PDF_BACKEND_URL`.

---

## 3. Trust zones

There are three distinct trust zones, and **mixing them is the main source of bugs**:

| Zone | Principals | What it can do |
|---|---|---|
| **Public** | Anyone with a link | Register at `/create`, upload to `/dataExchange/:id`, read most Firestore docs (rules are catch-all-public for read) |
| **Admin-authenticated** | Firebase user with `role ∈ {admin, super_admin, limited_admin}` | Write candidate docs, generate documents, send emails, manage groups |
| **Super-admin-only** | `role = super_admin` | User management, role assignment, destructive ops |

**Rules do not enforce all of this.** Firestore rules block most unauthorized writes, but admin endpoints in Functions also verify the ID token and role server-side. Admin SDK bypasses rules entirely, so **Functions MUST check auth explicitly** — this is a common mistake to watch for.

See [../reference/security-rules.md](../reference/security-rules.md) for the rule summary and [security-model.md](security-model.md) for the "why."

---

## 4. Frontend route topology

| Shell | Routes |
|---|---|
| **Public** | `/login`, `/create`, `/dataExchange/:id`, `*` (NotFound) |
| **Protected (any admin role)** | `/`, `/profile`, `/statistics`, `/collectionCv/:major`, `/generate/:major/:id` |
| **Admin shell** | `/candidates/*` |
| **Super admin shell** | `/settings/*` |

Full reference in [../reference/routes.md](../reference/routes.md).

---

## 5. The Generate module

The `/generate/:major/:id` page is the most complex surface in the app. It's a full candidate editor with live CV preview, document generation, comment thread, status workflow, and two-way document exchange — all in a single view. It is deliberately split into many small files:

```
src/pages/generate/
├── index/          page entry + top-level container
├── layout/         top bar, overlays, split-pane composition
├── sections/       form blocks (personal info, documents, comments, status, …)
├── modals/         modal host + individual modal wrappers
├── hooks/          50+ feature hooks (orchestration, saves, syncs, effects)
├── utils/          pure helpers (formatters, parsers, validators)
├── constants/      section configs, form defaults
├── mappers/        Firestore doc ↔ form state
├── components/     shared UI within generate/
└── pdf/            CV PDF renderer + styles
```

The `/create` page (public candidate registration) uses the same pattern on a smaller scale.

See [../reference/project-structure.md](../reference/project-structure.md) for file-level detail.

---

## 6. Core data flows

### Candidate submission

```
User fills /create
  → reCAPTCHA v2 token
  → POST /checkRegistry  (is email/passport/telegramId already registered?)
  → POST /submitCandidate (public, reCAPTCHA-verified)
    ├── server-side recaptcha verify
    ├── duplicate check against email_and_passId registry
    ├── write to {collectionName}/{candidateId}
    ├── write to email_and_passId/{registryId}
    └── optional: Telegram group invite link
  → client shows Thank You + confetti
```

### Candidate status update (admin)

```
Admin changes stage_X outcome in /generate/:major/:id
  → Firestore write to candidate doc
  → syncRemoteAllUsers trigger fires → mirrors to json-api.uz
  → Admin clicks "Send email"
    → Frontend formats Brevo payload with email_templates/{stage}
    → Brevo bridge delivers
  → If rejected: removeUserFromTelegramGroups called
    → iterate active telegram_groups
    → Telegram banChatMember + unbanChatMember
```

### Document generation + delivery

```
Admin opens Beratungsvertrag tab in /generate/:major/:id
  → Form pulls candidate data from Firestore
  → @react-pdf/renderer produces PDF in browser
  → Admin clicks "Send":
    ├── Upload to Storage: outgoing/{candidateId}/{docId}.pdf
    ├── Write reference to candidate.outgoingDocuments[]
    └── Generate data-exchange link for candidate
  → Candidate opens /dataExchange/{candidateId}
  → Downloads, signs, uploads scan back
  → Written to Storage: incoming/{candidateId}/{docId}.pdf
  → Rule allows public write to incomingDocuments (narrow exception)
```

See [candidate-lifecycle.md](candidate-lifecycle.md) and [document-generation.md](document-generation.md) for the full flows.

---

## 7. Design decisions worth knowing

### Why no TypeScript?

JSX with JSDoc is used throughout. The project predates a TS migration, and the 200-line-per-file rule plus tight hook boundaries have kept type accidents manageable. Adding TS is on the table but not scoped.

### Why Redux for just auth state?

Historical. The rest of the app moved to Firestore subscriptions + local component state. Redux remains because `authReady` needs to be globally available to prevent redirect flicker during auth bootstrap.

### Why dual backends (Functions + Express PDF)?

`pdf-lib` form-field manipulation on fillable German government PDFs is awkward in Functions' cold-start-sensitive environment and fragile in serverless timeouts. A small always-warm Express service gives predictable latency. Everything else that _could_ be a microservice stays in Functions.

### Why catch-all public Firestore reads?

The candidate public-registration flow needs to read `meta/{linkId}` to resolve a major before the user is authenticated. Rather than carve out per-collection rules, the app reads broadly and relies on the fact that admin identifiers (emails, internal notes) are either absent from public surfaces or gated by additional client-side checks. This is a known tradeoff — if confidentiality requirements tighten, the catch-all needs to become an allowlist.

### Why does the PDF backend exist separately?

Covered above — fillable-PDF manipulation is the only workload that doesn't fit the Functions model.

---

## 8. Deployment model

| Surface | Builds to | Deploys via |
|---|---|---|
| Frontend | `dist/` | Firebase Hosting (`firebase deploy --only hosting`) |
| Cloud Functions | — | `firebase deploy --only functions` (from `functions/`) |
| PDF backend | — | Separately (Cloud Run / VM / etc., from `backend/`) |

See [../how-to/deploy-to-production.md](../how-to/deploy-to-production.md) for the deploy runbook.
