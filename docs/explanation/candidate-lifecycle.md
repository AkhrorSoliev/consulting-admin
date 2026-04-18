# Candidate lifecycle

How a candidate moves through the system, from the moment they click a registration link until they're placed with a German employer (or rejected at one of the stages along the way).

This doc explains the _why_ and the _flow_. For stage names and label formats see [../reference/candidate-stages.md](../reference/candidate-stages.md). For the exact data shape see [../reference/firestore-collections.md](../reference/firestore-collections.md).

---

## Overview

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Registration   │ ──► │  Stage 1     │ ──► │  Stage 2     │ ──► │  Stage 3     │ ──► │  Stage 4     │
│  (public form)  │     │  Internal    │     │  Management  │     │  Employer    │     │  Employer    │
│                 │     │  interview   │     │  review      │     │  interview   │     │  decision    │
└─────────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                              │                     │                    │                    │
                              └── rejected ─────────┴────────────────────┴────────────────────┴─► archived_users
                                                                                                   + telegram removal
                                                                                                   + rejection email
```

Each stage has an outcome (`accepted` or `rejected`). Acceptance advances the candidate; rejection removes them.

---

## Stage 0 — Registration

### Entry points

Candidates arrive via one of two links:

1. **Direct link** — copied from the admin Home page. Example: `https://admin.consultinguz.de/create?linkId=<uuid>`
2. **Telegram deep link** — `https://t.me/consultinguz_bot?start=<majorCode>`. The bot resolves the code, extracts the candidate's Telegram ID, and redirects them to the create form with both `major` and `telegramId` pre-filled.

The Telegram path is preferred: it gives the admin the candidate's Telegram ID up front, which is needed later for group invites and auto-removal on rejection.

### What happens

1. `/create` resolves the `linkId` from `meta/{linkId}` to find the target candidate collection.
2. The candidate completes 5 steps: personal info → education → languages → skills → documents.
3. Before submit, the frontend calls `POST /checkRegistry` to detect duplicates (email, passport ID, Telegram ID).
4. If clean, `POST /submitCandidate` runs with a reCAPTCHA v2 token. The function verifies the token server-side, re-checks duplicates, and writes:
   - the candidate doc to `{collectionName}/{candidateId}`
   - a duplicate-prevention entry to `email_and_passId/{registryId}`
5. On success the candidate sees a confetti + Thank You card, and (if eligible) an invite to the active Telegram group.

### Why the duplicate registry?

Firestore doesn't do cross-collection unique constraints. `email_and_passId` is a flat registry we write in the same transaction as the candidate doc. Before a write we query it; the trigger `syncEmailAndPassIdRegistry` keeps it consistent with the canonical candidate data after edits.

Without this, the same person could register in multiple majors simultaneously and slip through.

---

## Stage 1 — Internal interview (pending)

New candidates land here by default. The internal team interviews them (phone/video) and records notes in the comments section of `/generate/:major/:id`.

### State

- Candidate doc: `stage: "stage_1"`, no `stageOutcome`.
- Badge: primary.
- Visible in `/collectionCv/:major` with the "1-bosqich" label.

### Transition

Admin opens the candidate in `/generate/:major/:id`, sets **stage_1 outcome**:

- **accepted** → candidate advances to `stage_2`.
- **rejected** → archive + email + (if present) Telegram auto-remove.

Each outcome triggers a stage-specific email template from `emailTemplates/{stage_1_accepted}` or `emailTemplates/{stage_1_rejected}`.

---

## Stage 2 — Management review

The candidate's file (comments, CV, rating) is reviewed by management. No external interaction happens here — this is an internal gate before scheduling the employer interview.

### State

- `stage: "stage_2"` (pending) or `stage_2_result` (decision recorded).
- Badge: info.

### Transitions

Same binary outcome model. A `stage_2` candidate waits for the management decision; once recorded, they either advance to `stage_3` or are rejected.

---

## Stage 3 — Employer interview invitation

The candidate is invited to interview with a concrete German employer.

### State

- `stage: "stage_3"`.
- Badge: warning.
- Candidate receives the employer introduction email with interview schedule.

### Transitions

- **accepted** → `stage_4` (employer decision pending).
- **rejected** → archive; the employer declined to move forward, _or_ the candidate declined the offer.

This is the only stage where "rejected" can mean either side said no — the comments field is the source of truth for which.

---

## Stage 4 — Employer decision

Final gate. The employer commits (or doesn't) to hiring.

### State

- `stage: "stage_4"`.
- Badge: success.

### Transitions

- **accepted** → the candidate is **placed**. They remain in the live collection but all further work is document preparation: visa papers, employment contracts, housing confirmation, Zusatzblätter for the German labor agency, etc. See [document-generation.md](document-generation.md).
- **rejected** → archived.

Placed candidates are not moved to a separate collection. They stay in the job-field collection with all history intact — you can tell a placed candidate by `stage: "stage_4"` and `stageOutcome: "accepted"`.

---

## Rejection, archival, and cleanup

When any stage outcome is `rejected`:

1. **Email** — `emailTemplates/{stage_X_rejected}` is sent with the candidate's name substituted in.
2. **Telegram auto-remove** — if the candidate has a `telegramId`, `POST /removeUserFromTelegramGroups` iterates all active groups in `telegram_groups` and calls Telegram's `banChatMember` + `unbanChatMember` for each. Failures are non-blocking; candidates who weren't members anyway return `was_not_member: true`.
3. **Archive** — admin confirms via the delete modal; the doc is copied to `archived_users/{candidateId}` and removed from the live collection.

Archived candidates are restorable. Permanently-deleted candidates land in `deleted_users/{candidateId}` as an audit trail.

---

## The comments thread

Every candidate has a TipTap-based comments thread, visible in `/generate/:major/:id`. This is where internal discussion happens.

- Each comment has author, timestamp, rich-text body.
- Reactions (👍 / 👎) track sentiment at a glance.
- `limited_admin` role can read but not react or edit.
- Author avatars are resolved from the `users` collection, with DiceBear initials as fallback.
- Comments auto-paginate in the generated CV PDF — useful for longer histories.

The default comment template pre-fills sections (Language level, Experience, Motivation, Family situation, Physical fitness) so comparable data is captured across candidates.

---

## Data exchange

Throughout stages 2–4, admins generate PDF documents (contracts, consents, questionnaires) that the candidate needs to sign. The flow:

1. Admin generates PDF in `/generate/:major/:id` → uploaded to `outgoing/{candidateId}/`.
2. Admin shares `/dataExchange/{candidateId}` with the candidate.
3. Candidate downloads, signs, uploads the scanned copy → stored at `incoming/{candidateId}/`.
4. The admin sees the uploaded scan in the candidate's profile.

This is a public-writable path protected only by the obscurity of the candidate ID. The Firestore/Storage rules have narrow exceptions to allow the uploads. See [security-model.md](security-model.md) for the reasoning.

---

## What to read next

- [document-generation.md](document-generation.md) — the full list of documents produced at each stage, and how.
- [../reference/candidate-stages.md](../reference/candidate-stages.md) — exact stage keys and badge colors.
- [../reference/cloud-functions.md](../reference/cloud-functions.md) — the endpoints invoked at each transition.
