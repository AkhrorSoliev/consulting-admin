# Security rules reference

Summary of the access rules in [`firestore.rules`](../../firestore.rules) and [`storage.rules`](../../storage.rules). The file content is authoritative — this reference is for quick lookup.

For the _why_ behind these rules see [../explanation/security-model.md](../explanation/security-model.md).

---

## Role source

All role checks rely on the Firebase Auth custom claim `role`, readable in rules as `request.auth.token.role`:

```
request.auth.token.role in ['super_admin', 'admin']
```

---

## Firestore rules

### Global posture

| Operation | Default |
|---|---|
| `read` | Public (catch-all allows any authenticated or anonymous read) |
| `write` | Role-restricted with narrow public exceptions |

### `/users/{userId}`

| Operation | Who |
|---|---|
| `read` / `write` | Owner (`request.auth.uid == userId`) |
| `read` | Any admin role |

### `/candidate_metadata/{candidateId}`

| Operation | Who |
|---|---|
| `read` | Public |
| `write` | `admin` or `super_admin` |

### `/meta/{metaId}`

| Operation | Who |
|---|---|
| `read` | Public |
| `write` | `admin` or `super_admin` |

### `/cv_index/{collectionName}/items/{candidateId}`

The candidate list projection. Four segments deep, so the catch-all below does not reach it.

| Operation | Who |
|---|---|
| `read` | Any admin role (`super_admin`, `admin`, `limited_admin`) |
| `write` | Nobody — only `syncCandidateListIndex` writes it, and the Admin SDK bypasses rules |

The empty `cv_index/{collectionName}` parent documents are still matched by the catch-all below; they hold no data.

### Catch-all `/{collectionName}/{documentId}`

Applies to candidate collections (`pflegefachkraft`, `krankenpfleger`, …) and any other top-level collection not explicitly matched above.

| Operation | Who |
|---|---|
| `read` | Public |
| `create`, `delete` | `admin` or `super_admin` |
| `update` | Depends on role — see below |

#### Update rules by role

| Role | Allowed update scope |
|---|---|
| `super_admin` | All fields |
| `admin` | All fields **except** reaction fields (those are `super_admin`-only to prevent moderator drift) |
| `limited_admin` | Only these fields: `commentar`, `commentarMeta`, and selected profile sub-objects. `commentarMeta` shape is validated (must have `updatedByName`, `updatedByUid`, `updatedAt`) |
| Public (unauthenticated) | Only updates where the **single field changing** is `incomingDocuments` — for the `/dataExchange/:id` flow |

> [!IMPORTANT]
> The public `incomingDocuments` update exception is the only way an anonymous user can mutate a candidate doc. The rule validates that **nothing else** in the document is modified by the same write.

---

## Storage rules

### Public read paths

All of:

- `passports/*`
- `diplomas/*`
- `certificates/*`
- `outgoing/*`
- `incoming/*`
- `avatars/*`
- `photos/*`

Relies on URL secrecy (candidate IDs are random) and file-format constraints.

### Write behavior per path

| Path | Create | Update / Delete | Content | Max size |
|---|---|---|---|---|
| `passports/*`, `diplomas/*`, `certificates/*` | Public | Auth | PDF | 2 MB |
| `outgoing/*` | Auth | Auth | PDF | 5 MB |
| `incoming/*` | Public | Public | PDF | 5 MB |
| `avatars/*` | Auth | Auth | Image | 500 KB |
| `photos/*` | Public | Auth | Image | 250 KB |

`Auth` = `request.auth != null` — any signed-in Firebase user. For writes that should be admin-only (e.g., `outgoing/`), Functions provide the real enforcement; any authenticated user _could_ write to `outgoing/` per rules, but Functions produce these files server-side so no client ever initiates such a write directly.

---

## What the rules do **not** cover

1. **Admin SDK writes bypass rules.** Every Cloud Function using `admin.firestore().doc(...).update(...)` writes unconditionally. Functions MUST verify auth + role explicitly at the top of the handler. This is covered in every admin endpoint — but when adding a new one, forgetting this check is the easiest security bug to introduce.

2. **Role escalation prevention.** Rules don't prevent an `admin` from calling `setUserRole`. That protection lives only in the callable's server-side check (`context.auth.token.role === 'super_admin'`).

3. **Rate limiting.** Firestore rate-limits aggressively at the backend, but per-user per-action rate limiting is not rule-level. For the public `submitCandidate` flow, reCAPTCHA provides the bot-protection layer.

4. **Read privacy.** Catch-all `read: true` means confidentiality is not enforced at the rule level for the catch-all collections. Mitigation: sensitive fields (internal notes with PII) live inside `commentar` HTML, not as enumerable top-level fields, and the registry (`email_and_passId`) stores minimal data.

---

## How to test rule changes

Firebase provides a rules emulator and test SDK. Rough workflow:

```bash
# Lint rules syntax
firebase deploy --only firestore:rules --dry-run

# Run the rules emulator
firebase emulators:start --only firestore,storage

# Write unit tests against the emulator
npm test  # if rule tests are added
```

As of now there are no automated rule tests — changes are reviewed by hand. When adding a new collection, add a matching rule explicitly rather than relying on the catch-all.

---

## Recommended hardening path

If confidentiality requirements tighten:

1. Replace catch-all `read: true` with explicit per-collection allowlists.
2. Tighten `incoming/*` public writes to require a signed upload token (function-issued, time-limited).
3. Move admin write permissions from rule allowlists to server-side Functions exclusively — rules become a deny-all safety net, not the primary gate.

This is a significant refactor; none of it is urgent given the current threat model.
