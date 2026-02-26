# Architecture

## 1. High-level system

```text
React/Vite SPA (src)
  -> Firebase Auth (ID token + role claims)
  -> Firestore (application data)
  -> Firebase Storage (documents/images)
  -> Cloud Functions (business APIs, integrations)
  -> Optional Express PDF backend (template fill service)
  -> External services (Telegram, OpenAI, Brevo, json-api.uz)
```

## 2. Runtime boundaries

### Frontend (`src/`)
- Routing and access control are defined in `src/App.jsx`.
- Admin surfaces are wrapped by `ProtectedRoutes` and desktop-only guard.
- Public pages include `/create` and `/dataExchange/:id`.

### Backend A (`functions/`)
- Firebase Functions v2, Node 20.
- Owns admin HTTP/callable endpoints, public submit endpoint, triggers, and integration logic.
- Uses `defineSecret` for sensitive keys.

### Backend B (`backend/`)
- Separate Express service for PDF template analysis/filling.
- Called by frontend via `VITE_PDF_BACKEND_URL`.

## 3. Frontend route topology

### Protected/admin shell
- `/`
- `/profile`
- `/settings/*`
- `/collectionCv/:major`
- `/generate/:major/:id`
- `/candidates/*`

### Public routes
- `/login`
- `/create`
- `/dataExchange/:id`
- fallback `*` -> `NotFound`

## 4. Generate module architecture (refactor target)

Current structure under `src/pages/generate/`:
- `index/` - page entry and composition
- `layout/` - top bar, overlays, editor-content composition
- `sections/` - section-level UI blocks (personal info, documents, comments, status)
- `modals/` - modal host and modal-specific wrappers
- `hooks/` - domain hooks and helpers
- `utils/`, `constants/`, `mappers/`, `components/`, `pdf/`

Entry flow:
1. `src/pages/Generate.jsx` re-exports generate page entry.
2. `src/pages/generate/index/GeneratePage.jsx` is thin page wrapper.
3. `src/pages/generate/index/GeneratePageContainer.jsx` is expected to own orchestration logic.

## 5. Core business flows

### Candidate submission
1. Client submits from `/create`.
2. `checkRegistry` and `submitCandidate` handle duplicate protection + write.
3. Firestore candidate doc + registry are synchronized.
4. Notifications can be sent through Telegram/Brevo integrations.

### Candidate data exchange
1. Candidate opens `/dataExchange/:id`.
2. Metadata resolves candidate collection.
3. Incoming/outgoing documents are read/written in Firestore/Storage.

### Admin communication/status
1. Admin updates candidate status/stage.
2. Email/Telegram actions are triggered through Functions.
3. Counters and metadata are persisted.

## 6. Trust boundaries and security model
- Role claims: `super_admin`, `admin`, `limited_admin`, `user`.
- Sensitive operations are validated in Functions by ID token and role.
- Firestore/Storage rules permit parts of public read/write for candidate flows.

## 7. Deployment model
- Frontend static build: `dist/` (Firebase Hosting / Vercel rewrite present)
- Functions deploy from `functions/`
- PDF backend deploys separately from `backend/`
