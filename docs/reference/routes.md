# Routes

Every frontend route, its component, who can access it, and what it does. Defined in [src/App.jsx](../../src/App.jsx) (and mirrored in `src/app/routeConfig.jsx` for some routes).

## Access legend

| Symbol | Meaning |
|---|---|
| 🔓 Public | No authentication required |
| 🔐 Any admin role | `admin`, `super_admin`, or `limited_admin` |
| 👔 Admin | `admin` or `super_admin` |
| 👑 Super admin | `super_admin` only |

---

## Core routes

| Path | Component | Access | Purpose |
|---|---|---|---|
| `/` | `Home` | 🔐 | Berufsfelder (job fields) table with candidate counts and link toggles |
| `/login` | `Login` | 🔓 | Email/password login with reCAPTCHA |
| `/profile` | `Profile` | 🔐 | Current user's profile (display name, avatar, contact) |
| `/statistics` | `Statistics` | 🔐 | Live + historical metrics with Excel export |
| `/collectionCv/:major` | `CollectionCv` | 🔐 | Candidate table for a major (10/page, filters, search) |
| `/generate/:major/:id` | `Generate` | 🔐 | Full candidate editor + live CV preview + document generation |

---

## Candidate archive

| Path | Component | Access | Purpose |
|---|---|---|---|
| `/candidates/` | `CandidatesLayout` | 👔 | Archive hub (nav only) |
| `/candidates/all` | `CandidatesAllUsers` | 👔 | All active candidates (disabled in UI) |
| `/candidates/archived` | `CandidatesArchivedUsers` | 👔 | Soft-deleted candidates, with restore |
| `/candidates/deleted` | `CandidatesDeletedUsers` | 👔 | Permanently deleted (audit trail, read-only) |
| `/candidates/archived-directions` | `CandidatesArchivedDirections` | 👔 | Archived job fields |

---

## Settings

All settings are super-admin-only or admin-only as noted.

| Path | Component | Access | Purpose |
|---|---|---|---|
| `/settings/` | `SettingsLayout` | 👔 | Settings hub (nav only) |
| `/settings/admins` | `AdminsSettings` | 👑 | Manage admin users & role claims |
| `/settings/telegram-groups` | `TelegramGroupsSettings` | 👔 | Telegram group invite links |
| `/settings/telegram-channels` | `TelegramChannelsSettings` | 👔 | Telegram channel configuration |
| `/settings/directions` | `DirectionsSettings` | 👔 | Manage Berufsfelder metadata |
| `/settings/template-emails` | `TemplateEmailsSettings` | 👔 | Per-stage email templates |
| `/settings/fillable-pdf-defaults` | `FillablePdfDefaultsSettings` | 👔 | Pre-fill defaults for Zusatzblatt A–D |
| `/settings/documents` | `DocumentsSettings` | 👔 | Document template index |

### Document template editors

Each is a split-pane editor with live PDF preview.

| Path | Template | Pipeline |
|---|---|---|
| `/settings/documents/beratungsvertrag` | Consulting contract | Client-side (`@react-pdf/renderer`) |
| `/settings/documents/vermittlungsvertrag` | Placement contract | Client-side |
| `/settings/documents/vollmacht` | Power of attorney (broker) | Client-side |
| `/settings/documents/vollmacht-arbeitgeber` | Power of attorney (employer, §81a) | Client-side |
| `/settings/documents/rozilik-xati` | Parental consent (UZ/DE) | Client-side |
| `/settings/documents/nomzod-rozilik-xati` | Candidate consent (UZ/DE) | Client-side |
| `/settings/documents/mitarbeiterwohnung` | Employee housing confirmation | Client-side |
| `/settings/documents/sprachsbestaetigung` | Language level certification | Client-side |
| `/settings/documents/einwilligungserklaerung` | GDPR consent | Client-side |
| `/settings/documents/foto-video-rozilik` | Photo/video consent (UZ/DE) | Client-side |
| `/settings/documents/personalfragebogen` | Personnel questionnaire | Client-side |
| `/settings/documents/erklaerung-beschaeftigung` | Employment declaration | PDF backend |
| `/settings/documents/zusatzblatt-a` | Credential recognition | PDF backend |
| `/settings/documents/zusatzblatt-b` | ICT / personnel transfer | PDF backend |
| `/settings/documents/zusatzblatt-c` | Professional truck driver | PDF backend |
| `/settings/documents/zusatzblatt-d` | Short-term employment (≤ 90d / 8mo) | PDF backend |
| `/settings/documents/beschaeftigungsverhaeltnis` | Employment relationship | PDF backend |

---

## Public routes (link-gated)

| Path | Component | Access | Purpose |
|---|---|---|---|
| `/create` | `Create` | 🔓 (linkId required) | Multi-step candidate registration form |
| `/dataExchange/:id` | `DataExchange` | 🔓 (candidate id required) | Candidate ↔ admin document exchange |
| `*` | `NotFound` | 🔓 | 404 fallback |

`/create` requires `?linkId=<uuid>` matching an active document in the `meta` collection with `linkActive: true`. `/dataExchange/:id` requires a valid candidate ID.

---

## Route-level code pointers

| Feature area | Entry file |
|---|---|
| Router + access control | [src/App.jsx](../../src/App.jsx) |
| Route config (partial) | [src/app/routeConfig.jsx](../../src/app/routeConfig.jsx) |
| Main layout | [src/layouts/MainLayout.jsx](../../src/layouts/MainLayout.jsx) |
| Settings layout | `src/pages/settings/SettingsLayout.jsx` |
| Candidates layout | `src/pages/candidates/CandidatesLayout.jsx` |
| Protected-route wrapper | `src/components/ProtectedRoutes.jsx` |
| Desktop-only guard | `src/components/DesktopGuard.jsx` |
