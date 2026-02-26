# Data Model

This document summarizes practical Firestore and Storage structures used by the application.

## 1. Firestore collections

### `meta`
Direction/major metadata and link activation settings.
Typical fields:
- `collectionName`
- `title`
- `uuid` / `linkId`
- `linkActive`
- `leadLinksActive`
- `leadLinks`
- `isDeleted`

### Dynamic candidate collections
Examples: `pflegefachkraft`, `krankenpfleger`, `altenpfleger`, etc.
Typical candidate fields:
- personal info (`personalInfo` / mapped variants)
- process/status fields
- document references
- `incomingDocuments`
- comment/reaction/rating metadata

### `candidate_metadata`
Fast lookup metadata for candidate id -> source collection.
Typical fields:
- `collectionName`
- `allowIncomingDelete`

### `email_and_passId`
Duplicate-prevention registry for create flow.
Typical fields:
- `email`
- `passportId`
- `telegramId`
- `major`
- `sourceMajor`
- `sourceDocId`
- timestamps

### `telegram_groups` / `telegram_channels`
Telegram targets and counters.
Typical fields:
- `name`
- `chat_id`
- `active`
- counters (`linksSentCount`, etc.)

### `users`
Auth-synced profile metadata and admin visibility.

### Other operational collections
Seen in code:
- `pending_registrations`
- `bot_interactions`
- `emailTemplates`
- `deleted_users`
- remote mirror-related collections

## 2. Storage paths

| Path | Typical content | Constraints |
|---|---|---|
| `passports/` | passport PDFs | PDF, small size limit, mixed public/auth writes by rule |
| `diplomas/` | diploma PDFs | PDF, mixed public/auth writes by rule |
| `certificates/` | certificate PDFs | PDF, mixed public/auth writes by rule |
| `outgoing/` | generated outgoing docs | Auth write, PDF |
| `incoming/` | candidate uploaded docs | Public write flow, PDF |
| `avatars/` | profile avatars | Auth write, image |
| `photos/` | candidate photos | Public create, auth update/delete, image |

## 3. Integrity patterns
- Candidate create and duplicate registry are kept consistent by submit logic and trigger sync.
- Remote mirror sync is best-effort and should not block critical writes.
- Role-based restrictions are enforced by both rules and server-side function checks.
