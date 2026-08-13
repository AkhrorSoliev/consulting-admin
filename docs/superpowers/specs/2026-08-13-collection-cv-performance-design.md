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
   (full CV, ~20 KB)                          (~400 bytes, flat)
                                                      │
                                       CollectionCv onSnapshot ◀┘
```

**Index schema.** Exactly the object `src/pages/collectionCv/mapCandidate.js` returns today.
The mapping logic is ported to `functions/src/utils/buildCandidateIndex.js` and the
Cloud Function stores the flat result. The client reads `d.data()` directly, so the
per-snapshot mapping cost disappears as well.

**Trigger.** `onDocumentWritten("{collectionId}/{docId}")`. Candidate collection names are
dynamic (one per Berufsfeld), so the trigger matches every top-level collection and filters:

- a denylist of system collections (`meta`, `users`, `settings`, `stats`,
  `archived_users`, `deleted_users`, `candidate_metadata`, `cv_index`, …), and
- a shape check that the document carries `persoenlicheDaten`.

On delete, the index document is deleted too.

**Risk.** A wildcard in the top-level collection segment is not documented by Firebase.
It must be confirmed against the emulator before deploy. Fallback if it does not work:
a single dual-write helper called from `persistCandidate` and the other client write paths.

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

~10 MB → ~200 KB per load (about 50×), and near-instant repeat visits from the persistent
cache.
