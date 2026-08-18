# Cloud Functions API

All functions exported from [functions/index.js](../../functions/index.js). Three categories: HTTP endpoints, callables, and Firestore triggers.

---

## Base URLs

| Kind | URL template |
|---|---|
| HTTP (deployed) | `https://<region>-<project>.cloudfunctions.net/<name>` |
| HTTP (local emulator) | `http://localhost:5001/<project>/<region>/<name>` |
| Callable | Invoked via `httpsCallable(functions, "<name>")` |
| PDF backend | `http://localhost:3001` locally, `VITE_PDF_BACKEND_URL` in deployed envs |

Frontend URL is built from `VITE_FUNCTIONS_BASE`. Individual endpoints can be overridden with `VITE_SUBMIT_CANDIDATE_URL` and `VITE_CHECK_REGISTRY_URL`.

---

## HTTP endpoints

### Public

| Name | Method | Purpose |
|---|---|---|
| `health` | GET | Service health check → `{ ok: true }` |
| `downloadProxy` | GET | Proxy remote PDF with `Content-Disposition` headers for browser download |
| `proxyPdf` | GET | CORS-safe PDF fetch proxy |
| `checkRegistry` | POST | Duplicate check for email / passport / telegram — returns which of the fields collide |
| `submitCandidate` | POST | Create a candidate. **reCAPTCHA v2 required** — token verified server-side |

### Admin-authenticated

All require `Authorization: Bearer <idToken>` with `role ∈ {admin, super_admin}`.

| Name | Method | Purpose |
|---|---|---|
| `generateInvite` | POST | Generate a one-time Telegram group invite link (`member_limit: 1`, `expire_date: now + 1h`) |
| `generateChannelInvite` | POST | Same, for a Telegram channel |
| `trackInviteSent` | POST | Increment `linksSentCount` on a `telegram_groups` document |
| `telegramGroupsFromUpdates` | GET | Discover groups/channels from the bot's `getUpdates` — used by admins seeding new chats |
| `removeTelegramGroupMember` | POST | Kick one user from one group |
| `getTelegramGroupMembers` | GET | List chat admins/members (within Telegram API limits) |
| `removeUserFromTelegramGroups` | POST | Remove a user from all active groups (used on candidate rejection) |
| `sendTelegramMessage` | POST | Direct message a chat from the bot |
| `openaiProxy` | POST | Proxy OpenAI chat completions (for motivation drafting in the editor) |

### Webhook

| Name | Method | Purpose |
|---|---|---|
| `telegramBotWebhook` | POST | Telegram bot callback. Handles `/start <majorCode>` deep links → returns personalized registration URL |

### Debug / operational

| Name | Method | Purpose |
|---|---|---|
| `debugMajors` | GET | Dump active directions from `meta` collection |
| `countState1Candidates` | GET | Aggregate stage counts for dashboards |

---

## Callables

Invoked via Firebase SDK `httpsCallable(functions, "<name>")`. Firebase handles auth context automatically — the function receives `context.auth.uid` and the user's `token.role` claim.

### Super-admin-only

| Name | Purpose |
|---|---|
| `listUsers` | List Firebase Auth users |
| `createUser` | Create a new Auth user (email + password) |
| `deleteUser` | Delete an Auth user |
| `disableUser` | Disable an Auth user |
| `enableUser` | Re-enable a disabled user |
| `setUserPassword` | Reset a user's password |
| `setUserRole` | Set custom claim `role` on a user |

### Admin + super-admin

| Name | Purpose |
|---|---|
| `sendInviteToCandidate` | Generate + DM a Telegram group invite to a candidate by their `telegramId` |
| `kickCandidate` | Remove a candidate from all groups by their `telegramId` |

---

## Firestore triggers

Run automatically on Firestore writes — no client invocation.

| Name | Trigger | Purpose |
|---|---|---|
| `syncEmailAndPassIdRegistry` | `onDocumentWritten({collectionId}/{docId})` | Keep the duplicate-prevention registry in sync with candidate canonical docs |
| `syncRemoteAllUsers` | `onDocumentWritten({collectionId}/{docId})` | Best-effort mirror to `json-api.uz` for external reporting |
| `syncCandidateListIndex` | `onDocumentWritten({collectionId}/{docId})` | Maintain the `cv_index` list projection so CollectionCv never downloads full CV documents |

`syncCandidateListIndex` skips the write when no indexed field changed, so document
uploads and CV autosaves — which touch nothing the list shows — cost nothing. Seed
existing candidates once with `node functions/scripts/backfill-cv-index.cjs`
(`--dry-run`, `--collection=NAME`, `--prune` supported).

---

## Response conventions

Successful HTTP endpoints return `{ ok: true, ... }`. Failures return `{ ok: false, error: "<code>", details?: ... }`.

| HTTP status | When |
|---|---|
| `200` | Success |
| `400` | Validation failure (missing fields, bad format) |
| `401` | Missing or invalid ID token |
| `403` | reCAPTCHA verification failed, or role check failed |
| `409` | Duplicate conflict in `submitCandidate` |
| `500` | Server error (e.g., reCAPTCHA not configured, Telegram API down) |

Callable errors use Firebase's native `HttpsError` codes — `permission-denied`, `unauthenticated`, `invalid-argument`, `not-found`, `internal`.

---

## PDF backend endpoints

Separate Express service at [backend/server.js](../../backend/server.js).

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check |
| `/templates` | GET | List PDF templates in `backend/pdf/` |
| `/analyze/:filename` | GET | Inspect a template's form fields — dev tool |
| `/generate-pdf` | POST | Fill a template's fields and return the PDF |

Request body for `/generate-pdf`:

```json
{
  "templateName": "zusatzblatt-a.pdf",
  "fields": { "fieldName1": "value1", ... }
}
```

No authentication on this service — it's deployed behind a private network boundary, and the templates themselves contain no secrets.

---

## Secrets

Three secrets are accessed via `defineSecret` inside Functions:

| Secret | Used by |
|---|---|
| `TELEGRAM_BOT_TOKEN` | All Telegram-integration functions + `telegramBotWebhook` |
| `RECAPTCHA_SECRET_KEY` | `submitCandidate` |
| `OPENAI_API_KEY` | `openaiProxy` |

Set with `firebase functions:secrets:set <NAME>`. See [environment-variables.md](environment-variables.md).

---

## External services called

- **Telegram Bot API** (`api.telegram.org`)
- **Google reCAPTCHA verification API**
- **OpenAI Chat Completions** (via `openaiProxy` only — never direct from frontend)
- **Brevo email bridge**
- **`json-api.uz`** (remote mirror)
