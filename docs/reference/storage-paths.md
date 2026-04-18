# Cloud Storage paths

Canonical layout of the Firebase Cloud Storage bucket. All paths are relative to the bucket root (`gs://<bucket>/…`).

Rule behavior (public vs. authenticated, size limits) is summarized from [`storage.rules`](../../storage.rules).

---

## Candidate documents

### `passports/`, `diplomas/`, `certificates/`

Candidate-uploaded source documents. Filename pattern: `{candidateId}.pdf` or `{candidateId}/{originalName}.pdf`.

| Aspect | Value |
|---|---|
| Content | PDF |
| Max size | 2 MB |
| Read | Public |
| Create | Public (during `/create` submission) |
| Update / Delete | Authenticated admin only |

### `outgoing/{candidateId}/`

Generated PDFs sent _to_ the candidate (contracts, consents, invitations).

| Aspect | Value |
|---|---|
| Content | PDF |
| Max size | 5 MB |
| Read | Public (candidate accesses via `/dataExchange/:id`) |
| Write | Authenticated admin only |

### `incoming/{candidateId}/`

Signed scans uploaded _by_ the candidate at `/dataExchange/:id`.

| Aspect | Value |
|---|---|
| Content | PDF |
| Max size | 5 MB |
| Create | Public (candidate upload) |
| Update / Delete | Public (candidate can replace their own uploads) |

This is the only path with public write + delete — see the discussion in [../explanation/security-model.md](../explanation/security-model.md#public-write-paths--the-exceptions).

---

## Images

### `avatars/`

Admin user profile pictures.

| Aspect | Value |
|---|---|
| Content | Image (PNG/JPEG/WebP) |
| Max size | 500 KB |
| Read | Public |
| Write | Authenticated only |

### `photos/`

Candidate profile photos, used on the generated CV.

| Aspect | Value |
|---|---|
| Content | Image (PNG/JPEG) |
| Max size | 250 KB |
| Create | Public (during `/create`) |
| Update / Delete | Authenticated admin only |

---

## Size & content enforcement

Storage rules enforce both content type (`request.resource.contentType.matches('application/pdf')` or `image/.*`) and byte size. Files that don't match are rejected at upload.

Client-side resizing happens for `avatars` (500 KB target) and `photos` (250 KB target) in the upload utilities — if the file is too big the UI either compresses or errors.

---

## Path conventions

- Per-candidate subfolders use the Firestore document ID as the subfolder name.
- Document IDs are long random strings; enumeration is infeasible — this is what allows the public `/dataExchange/:id` flow to rely on URL secrecy.
- Storage does not enforce referential integrity with Firestore. If a candidate is hard-deleted, their storage files are **not** automatically removed. There's no scheduled cleanup — this is a known housekeeping gap.

---

## Accessing files from the frontend

Files are fetched via:

- **Public read** → direct `gs://` URL through `getDownloadURL()` from Firebase SDK.
- **Signed URLs** are not used — all paths are either public-read or admin-authenticated.
- **Download proxy** — for PDFs that need `Content-Disposition: attachment` headers, the frontend calls `downloadProxy` HTTP function (see [cloud-functions.md](cloud-functions.md)). This avoids browsers showing the PDF inline when the admin wants to download.

---

## See also

- [Security rules](security-rules.md) — rule text summary for storage
- [Firestore collections](firestore-collections.md) — where the Storage paths are referenced
- [Document generation](../explanation/document-generation.md) — how `outgoing/` and `incoming/` are used
