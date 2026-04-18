# Firestore collections

Shapes of every collection the app reads or writes. Field names reflect the code's usage; types are inferred from SDK calls and usage sites. Firestore is schemaless — individual documents may have extra fields or be missing some.

For security-rule behavior per collection see [security-rules.md](security-rules.md).

---

## `meta`

Metadata for Berufsfelder (job fields / majors). One document per job field.

| Field | Type | Notes |
|---|---|---|
| `uuid` | string | Identifier used in URLs |
| `linkId` | string | Short token used in public `/create?linkId=…` URLs |
| `name` | string | Internal key (lowercase, underscore) — matches the candidate collection name |
| `collectionName` | string | The Firestore collection that holds candidates for this major |
| `title` | string | Display title (German) |
| `description` | string | Optional description for admins |
| `linkActive` | boolean | If false, `/create` rejects registrations for this major |
| `leadLinksActive` | boolean | Whether lead-funnel links are allowed |
| `leadLinks` | array | Lead capture link configs |
| `isDeleted` | boolean | Soft-delete flag (candidates are moved to `archived_directions` on delete) |
| `createdAt` | Timestamp | Server timestamp at creation |
| `createdBy` | string (uid) | Admin who created the major |

---

## Dynamic candidate collections

Each active `meta` document has a `collectionName` pointing to its candidate collection (e.g., `pflegefachkraft`, `krankenpfleger`, `altenpfleger`, `kfz_mechatroniker`, …). Every candidate doc has approximately this shape:

### Identity

| Field | Type | Notes |
|---|---|---|
| `firstName`, `lastName` | string | |
| `email`, `phone` | string | Phone in E.164 |
| `passportId` | string | Duplicate-checked via `email_and_passId` |
| `telegramId` | string/number | Provided when arriving via bot deep link |
| `gender` | string | `male` / `female` |
| `birthDate`, `birthPlace` | string / object | |
| `maritalStatus`, `children` | string / array | |

### Location

| Field | Type | Notes |
|---|---|---|
| `address` | object | German address components (street, number, zip, city) |
| `region`, `city` | string | Uzbekistan origin |

### Profile & process

| Field | Type | Notes |
|---|---|---|
| `education` | array | School, graduation year, field |
| `experience` | array | Title, company, duration, description |
| `languages` | array | `{ level: "B1", certificate: { ... } }` |
| `skills` | array of string | Tag list |
| `drivingLicense` | string / null | Category or null |
| `photoURL`, `signatureURL` | string | Storage paths |
| `stage` | string | One of `stage_1`, `stage_2`, `stage_2_result`, `stage_3`, `stage_4` |
| `stageOutcome` | object | Per-stage outcomes: `{ stage_1: "accepted", stage_2: "rejected", ... }` |
| `rating` | number | 1–5 stars, optional |
| `isFavorite` | boolean | Star toggle in the list view |

### Documents

| Field | Type | Notes |
|---|---|---|
| `outgoingDocuments` | array | References to generated PDFs in `outgoing/` |
| `incomingDocuments` | array | Scans the candidate uploaded to `incoming/` |
| `documents.passport`, `documents.diploma`, etc. | object | Storage paths for uploaded documents |

### Comments & reactions

| Field | Type | Notes |
|---|---|---|
| `commentar` | string (HTML) | TipTap-rendered rich-text body |
| `commentarMeta` | object | `{ updatedByName, updatedByUid, updatedAt }` |
| `reactions` | object | Per-user `{ [uid]: "like" | "dislike" }` |

### Audit

| Field | Type | Notes |
|---|---|---|
| `createdAt`, `updatedAt` | Timestamp | |
| `createdBy`, `updatedBy` | string | User UIDs |

---

## `candidate_metadata`

Fast lookup table: given a candidate ID, find which collection holds them. Useful because every candidate has a unique ID but lives in a collection named after their major.

| Field | Type |
|---|---|
| `candidateId` (doc ID) | |
| `collectionName` | string |
| `allowIncomingDelete` | boolean |

---

## `email_and_passId`

Duplicate-prevention registry. Populated on candidate create, kept in sync by the `syncEmailAndPassIdRegistry` trigger.

| Field | Type | Notes |
|---|---|---|
| `email` | string | Lowercase, trimmed |
| `passportId` | string | |
| `telegramId` | string/number | Optional |
| `major` | string | The canonical major key |
| `sourceMajor` | string | If the registration originated from a different major's link |
| `sourceDocId` | string | The candidate document ID |
| `createdAt`, `updatedAt` | Timestamp | |

`checkRegistry` queries this collection. Entries are updated (not re-created) if the candidate's contact info changes.

---

## `telegram_groups`

Active Telegram groups that candidates should be invited to after placement (or removed from on rejection).

| Field | Type |
|---|---|
| `name` | string |
| `chat_id` | string | Numeric, with `-100` prefix for super groups |
| `active` | boolean |
| `linksSentCount` | number |
| `createdAt` | Timestamp |

---

## `telegram_channels`

Same shape as `telegram_groups`, for broadcast channels rather than interactive groups.

---

## `users`

Admin user profiles, synced on login.

| Field | Type |
|---|---|
| `uid` (doc ID) | |
| `email` | string |
| `displayName` | string |
| `photoURL` | string | Custom upload or DiceBear fallback |
| `avatar` | string | Additional avatar data |
| `role` | string | Mirrors the Auth custom claim (for client display; authority is the claim itself) |
| `lastLogin` | Timestamp |
| `createdAt`, `updatedAt` | Timestamp |

---

## `stats/global`

Single aggregation document for historical statistics — persists even after candidate deletion.

| Field | Type | Notes |
|---|---|---|
| `directionsTotals` | object | Per-major lifetime counts |
| `stageCounts` | object | Lifetime count per stage and outcome |
| `allStats` | object | Other aggregated metrics |

Updated by frontend code on candidate writes (best-effort) — not by a trigger, to keep writes cheap.

---

## `settings` subcollections

Operational configuration. Each doc has a single purpose.

| Doc | Shape |
|---|---|
| `settings/admins` | `{ admins: [{ email, role }] }` — used by the Admins UI |
| `settings/telegram_groups` | Alternative group list source (legacy, some admins use this) |
| `settings/telegram_channels` | Same for channels |
| `settings/email_templates` | `{ templates: { stage_1_accepted: {...}, stage_1_rejected: {...}, ... } }` |
| `settings/fillable_pdf_defaults` | Pre-fill values for Zusatzblatt A–D and Erklärung Beschäftigung |

---

## Operational collections

Created by server code, mostly not user-visible.

| Collection | Purpose |
|---|---|
| `pending_registrations` | Temporary store for candidates mid-submission (expires quickly) |
| `bot_interactions` | Log of `/start` deep-link events from the Telegram bot |
| `emailTemplates` | Legacy email template store (the settings version is current) |
| `deleted_users` | Permanently-deleted candidate audit trail |
| `archived_users` | Soft-deleted candidates (restorable) |
| `archived_directions` | Soft-deleted `meta` entries |
| `documents/<docId>` | Per-template content for the document template editors |

---

## Document templates

Stored at `documents/<docId>` — one document per template. Shape varies by template but typically includes:

| Field | Type |
|---|---|
| `title` | string |
| `body` | string (HTML or structured text) |
| `clauses` | array | Template-specific clause objects |
| `defaults` | object | Pre-filled values for the admin editor |
| `updatedAt` | Timestamp |
| `updatedBy` | string (uid) |

See [../explanation/document-generation.md](../explanation/document-generation.md) for how these feed into PDF rendering.
