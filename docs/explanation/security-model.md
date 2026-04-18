# Security model

How authentication, authorization, and public surfaces work in Consulting Admin — and the deliberate tradeoffs behind the decisions.

For the _what_ (rule text, role table) see [../reference/security-rules.md](../reference/security-rules.md) and [../reference/admin-roles.md](../reference/admin-roles.md). This doc is about the _why_.

---

## Identity

Authentication is Firebase Auth, email + password. Every admin user has a custom claim `role ∈ {super_admin, admin, limited_admin, user}`.

The claim is set by super admins via the **Settings → Admins** UI, which calls the super-admin-only `setUserRole` callable. The token is refreshed on the client with `user.getIdToken(true)` to pick up new claims without a re-login.

There is no self-signup for admins. A super admin creates every account via `createUser`. Public users (candidates submitting at `/create`) are _never_ Firebase-authenticated — they interact with the system anonymously, protected by reCAPTCHA and by the narrowness of the public write paths.

---

## The three trust zones

```
Public                Admin-authenticated          Super-admin
(anonymous)           (role ∈ {admin, s.a.,         (role = super_admin)
                      limited_admin})

  │                          │                           │
  │ /create                  │ /generate                 │ /settings/admins
  │ /dataExchange/:id        │ /collectionCv             │ (user mgmt callables)
  │ /login                   │ /statistics               │
  │                          │ /settings/*               │
  │ GET catch-all Firestore  │                           │
  │                          │ Admin HTTP endpoints      │ Super-admin callables
  │ POST /submitCandidate    │ Telegram/email/PDF        │ (createUser, setUserRole,
  │ POST /checkRegistry      │                           │  deleteUser, …)
  │ PUT incomingDocuments    │                           │
  │ PUT incoming/*           │                           │
```

**The rule: you cannot upgrade across zones.** A public user cannot become an admin by calling a magic endpoint. An `admin` cannot promote themselves to `super_admin` — only an existing super admin (verified server-side in the callable) can issue that role.

---

## Two enforcement points

Every sensitive mutation is gated in **two independent places**:

1. **Firestore / Storage rules.** Run on every client SDK call, block unauthorized writes at the database edge.
2. **Cloud Functions.** On HTTP endpoints and callables, explicitly verify the ID token and role before doing anything.

Why both? Because **Admin SDK bypasses rules**. Any Function using `admin.firestore().doc(...).update(...)` writes regardless of what `firestore.rules` says. If the rule was the only check, a misconfigured admin endpoint would be an open door. Belt-and-suspenders is not paranoia here — it's the shape of the threat.

A concrete example: `sendTelegramMessage` is an HTTP POST. Its rule-level protection is "none, it's Functions." Its Functions-level protection is an explicit ID-token check + role verification at the top of the handler. Forgetting either one is a bug.

---

## Public write paths — the exceptions

Two public-write paths exist because candidates who aren't Firebase-authenticated must be able to submit data:

### 1. `/create` → `submitCandidate`

Public, but:

- Requires a valid reCAPTCHA v2 token (verified against Google on the server).
- Writes only to `{collectionName}/{candidateId}` and `email_and_passId/{registryId}` — no other collections.
- Rejects duplicates (email / passport / telegramId) via the registry.
- Rejects unknown `linkId` (must match an active `meta/{linkId}`).

If reCAPTCHA fails or the limit is exceeded, the request is rejected with a structured error.

### 2. `/dataExchange/:id` → `incomingDocuments` update + `incoming/*` Storage

Public, but:

- The URL requires a valid `candidateId`. The IDs are Firestore-generated, so guessing is computationally infeasible.
- The Firestore rule permits updates only if the _only field changing_ is `incomingDocuments` and the value is well-formed. A malicious caller cannot use this surface to change anything else on the candidate doc.
- The Storage rule permits `create` on `incoming/*` (PDF, 5MB max) for public users, and `update/delete` only for authenticated admins.

The tradeoff: anyone with a candidate's ID can upload a PDF to their document tray. If the ID leaks, a spammer could stuff the tray. We accept this risk because:

- Candidate IDs are not enumerable.
- The upload surface is heavily rate-limited by Storage.
- Admins see new uploads and can delete spam.
- The alternative — Firebase-authenticating candidates — adds massive friction for non-technical users and isn't in the product plan.

---

## Why catch-all public reads?

The Firestore rules allow `read: true` on most collections as a catch-all, with explicit write restrictions per path. Why?

1. **The `/create` flow needs to read `meta/{linkId}`** before the user authenticates, to resolve the target candidate collection. Without public reads, we'd need a Function for this — adding a round-trip to every registration.
2. **Admin users are already Firebase-authenticated** by the time they interact with protected pages; rule-level read restrictions for them would be redundant given how much data they need.

The cost: any document is world-readable. If `email_and_passId` leaked, it could deanonymize candidate registration. Mitigations:

- The registry only stores the minimum needed for duplicate checks (hashed-ish: email, passport number) — not names or stage data.
- Candidate IDs in URLs are long random strings; enumeration is infeasible.
- No admin-only data (internal comments with PII, rejection reasons) lives in a publicly-named collection.

If confidentiality requirements tighten, this catch-all must be replaced with an explicit per-collection allowlist. It's a known architectural debt.

---

## Secrets management

No secrets live in the frontend or in git:

| Secret | Where it lives | Loaded via |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Firebase Secret Manager | `defineSecret("TELEGRAM_BOT_TOKEN")` in Functions |
| `RECAPTCHA_SECRET_KEY` | Firebase Secret Manager | `defineSecret("RECAPTCHA_SECRET_KEY")` |
| `OPENAI_API_KEY` | Firebase Secret Manager | `defineSecret("OPENAI_API_KEY")` |

`RECAPTCHA_SITE_KEY` (the _public_ half) is in `VITE_RECAPTCHA_SITE_KEY` — safe to ship in the bundle.

The Firebase service account key (if present) must never be committed. `.gitignore` catches `serviceAccountKey.json` and `*-firebase-adminsdk-*.json` explicitly.

---

## reCAPTCHA

Only the public `/create` endpoint uses reCAPTCHA. We verify the token server-side in `submitCandidate` — rejecting the client-side check alone would be trivially bypassed.

For `localhost` development, Google's public test site/secret keys are used. They accept every challenge and are safe to commit (they're public test fixtures).

See [../how-to/setup-recaptcha.md](../how-to/setup-recaptcha.md) for the setup recipe.

---

## What we deliberately don't do

- **No field-level encryption** — Firestore's server-side encryption is relied upon; no additional client-side crypto.
- **No 2FA for admins** — Firebase Auth supports it, but we haven't enabled it. A future hardening step.
- **No audit log for reads** — only writes are traceable (via `updatedBy*` fields). If this becomes a compliance requirement, it needs adding.
- **No formal rate limiting beyond what Firebase provides** — Functions and Storage have default quotas, which are sufficient for current volume.

These are conscious tradeoffs, not oversights. Revisit them when the business context changes.

---

## What to read next

- [../reference/security-rules.md](../reference/security-rules.md) — the actual rule text summarized.
- [../reference/admin-roles.md](../reference/admin-roles.md) — the permissions matrix per role.
- [../how-to/manage-admin-roles.md](../how-to/manage-admin-roles.md) — how to assign roles in practice.
