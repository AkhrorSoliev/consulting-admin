# CollectionCv Performance — Design

**Date:** 2026-08-13
**Status:** Approved

## Problem

`/collectionCv/:major` takes many seconds to load for job fields with 500+ candidates,
and the count keeps growing.

Root causes, in order of impact:

1. **Full-document download, no limit.** `useCollectionData` subscribes with
   `onSnapshot(query(collection(db, name), orderBy("createdAt", "desc")))`. Every candidate
   document arrives in full — `persoenlicheDaten`, `berufserfahrung`, `ausbildung`,
   `faehigkeiten`, `documents`, `commentar` (rich-text HTML), `stageMeta`, `emailMeta`.
   That is roughly 10–30 KB per document, while the table renders about 30 flat fields.
   At 500 candidates this is ~10 MB over the wire, ~95 % of it unused.
2. **No persistent cache.** `src/firebase/config.js` uses `getFirestore(app)`, which keeps
   only an in-memory cache. Every full page load re-downloads everything from the network.
3. **Serial avatar fetches.** `useUserPhotos` awaits `getUserFromFirestore` inside a
   `for...of` loop, so N admin avatars cost N sequential round trips.
4. **Main-thread cost.** `mapCandidate` plus ten filters plus statistics run over the whole
   list on every snapshot, and every row re-renders.

### Rejected: server-side pagination

`limit()` with cursors does not fit. The page applies ten client-side filters, a
name substring search, and aggregate statistics — all of which need the complete set.
Firestore cannot express substring search, and composite indexes for ten independent
filter dimensions are not practical.

## Solution

Two stages. Stage A is low-risk and ships first; Stage B removes the root cause.

### Stage A — client-side quick wins

| Change | File |
|---|---|
| `getFirestore(app)` → `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })` | `src/firebase/config.js` |
| Serial `await` → `Promise.all` for all avatar lookups | `src/pages/collectionCv/hooks/useUserPhotos.js` |
| Extract the table row into a `React.memo` component | `src/pages/CollectionCv.jsx` → `src/pages/collectionCv/components/CandidateRow.jsx` |

The persistent IndexedDB cache means a repeat visit renders from local storage
immediately while Firestore syncs only changed documents via its resume token.

Extracting the row also brings `CollectionCv.jsx` (currently 353 lines) back under the
200-line limit in `CLAUDE.md`.

### Stage B — lightweight index collection

```
{berufsfeld}/{id}  ──onDocumentWritten──▶  cv_index/{berufsfeld}/items/{id}
   (full CV, ~10-30 KB)                       (~0.7-0.9 KB, flat)
                                                      │
                                       CollectionCv onSnapshot ◀┘
```

**Index schema.** Essentially the object `src/pages/collectionCv/mapCandidate.js` returns
today. The derivation lives in `functions/src/utils/candidateIndex.js`.

Two fields are deliberately *not* stored:

- `age` — it would go stale as birthdays pass, so `geburtsdatum` is stored raw and the
  client computes the age.
- `statusLabel` / `statusTone` — constant lookups from `statusValue`; storing them would
  force a backfill whenever `candidateStatus.js` changes.

Everything expensive (comment HTML scanning, certificate/experience/language traversal,
stage decisions) is precomputed, so `mapIndexedCandidate` on the client is trivial.

**Trigger.** `onDocumentWritten("{collectionId}/{docId}")`. Candidate collection names are
dynamic (one per Berufsfeld), so the trigger matches every top-level collection and filters:

- a denylist of system collections (`meta`, `users`, `settings`, `stats`,
  `archived_users`, `deleted_users`, `candidate_metadata`, `cv_index`, …), and
- a shape check that the document carries `persoenlicheDaten`.

On delete, the index document is deleted too. When a write does not change any indexed
field — which is most candidate writes, since documents and CV autosave touch nothing the
table shows — the projection is rebuilt and compared, and the write is skipped.

**Wildcard risk: resolved.** `onDocumentWritten("{collectionId}/{docId}")` is already
running in production in this project as `syncEmailAndPassIdRegistry`
(`functions/src/endpoints/registry.js:264`), so no fallback dual-write is needed.

**Deploy-order safety.** The client subscribes to the index and falls back to the source
collection when the index subcollection is empty or unreadable. Client and backend can
therefore ship in any order, and the page keeps working if the backfill has not run.

**Backfill.** `functions/scripts/backfill-cv-index.cjs` iterates the collections listed in
`meta` and writes index documents in batches.

**Rules.** `cv_index/{name}/items/{id}` is readable by authenticated admins and writable
only by the Admin SDK. The existing catch-all `match /{collectionName}/{documentId}` does
not cover this four-segment path, so an explicit rule is required.

**Unchanged behaviour.** Real-time updates (reaction and rating changes flow through the
trigger into the index), all ten filters, name search, statistics, and both Excel exports.
The full export already issues its own `getDocs` against the real collection
(`useCandidateActions.js:154`), so it is unaffected.

**Rollout order.** Deploy trigger → run backfill → publish rules → switch the client →
verify. Rollback is a one-line revert of the client read path; the source collections are
never modified.

## Expected result

Measured projection size is ~0.7–0.9 KB per candidate against 10–30 KB for a full
document, so a 500-candidate list drops from roughly 10 MB to under 0.5 MB — a 15–30×
reduction — plus near-instant repeat visits from the persistent cache.

## Operator steps

```bash
firebase deploy --only functions:syncCandidateListIndex
node functions/scripts/backfill-cv-index.cjs --dry-run   # verify counts
node functions/scripts/backfill-cv-index.cjs
firebase deploy --only firestore:rules
```

`--prune` additionally removes index entries whose source document no longer exists.
