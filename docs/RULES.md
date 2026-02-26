# Rules and Access Control

This file summarizes the implemented access model from `firestore.rules`, `storage.rules`, and server-side checks.

## 1. Role model
- `super_admin`
- `admin`
- `limited_admin`
- `user`

Role source: Firebase Auth custom claim `role`.

## 2. Firestore rules summary

### Global posture
- Public reads are broadly allowed by catch-all read rule.
- Writes are role-restricted, with a narrow public update exception for `incomingDocuments`.

### Collection-specific behavior
- `/users/{userId}`:
  - Owner can read/write own profile.
  - Admin roles can read users.
- `/candidate_metadata/{candidateId}`:
  - `read`: public
  - `write`: `admin` or `super_admin`
- `/meta/{metaId}`:
  - `read`: public
  - `write`: `admin` or `super_admin`

### Catch-all `/{collectionName}/{documentId}`
- `read`: public
- `create`, `delete`: `admin` or `super_admin`
- `update`:
  - `super_admin`: full
  - `admin`: restricted for reaction fields
  - `limited_admin`: limited fields only
  - public: only exact `incomingDocuments` updates

### Limited admin write scope
Allowed update groups include comment and selected profile sections only.
`commentarMeta` shape and attribution are validated.

## 3. Storage rules summary

### Public read paths
- `passports/*`, `diplomas/*`, `certificates/*`
- `outgoing/*`, `incoming/*`
- `avatars/*`, `photos/*`

### Write behavior by path
- `passports/*`, `diplomas/*`, `certificates/*`:
  - PDF, max 2MB
  - create can be public
  - update/delete require auth
- `outgoing/*`:
  - auth required
  - PDF, max 5MB
- `incoming/*`:
  - public create/update/delete
  - PDF, max 5MB
- `avatars/*`:
  - auth required
  - image, max 500KB
- `photos/*`:
  - create can be public
  - update/delete require auth
  - image, max 250KB

## 4. Function-level enforcement
- Admin endpoints verify bearer token and role (`admin`/`super_admin`).
- Super-admin callables enforce `super_admin` role.
- Public submit flow requires valid reCAPTCHA verification server-side.

## 5. Operational constraints
- Admin SDK in Functions bypasses Firestore rules, so endpoint auth checks are mandatory.
- If confidentiality requirements increase, replace catch-all public reads with explicit allowlists.
