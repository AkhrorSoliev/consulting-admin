# Consulting Admin — CLAUDE.md

## Overview

**Consulting Admin** is a B2B admin dashboard for an international employment consultancy placing candidates from Uzbekistan into jobs in Germany. It manages the full candidate lifecycle — from public registration, through internal interviews, document generation, and employer placement — with real-time statistics and role-based administration.

## Tech Stack

- **Frontend:** React 19, React Router v7, Redux Toolkit
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 + DaisyUI 5 (themes: `winter` light, `dracula` dark)
- **Backend:** Firebase (Firestore, Auth, Cloud Functions, Cloud Storage)
- **PDF:** `@react-pdf/renderer` for generated documents, `pdfjs-dist` for fillable PDF manipulation
- **Forms:** React Hook Form
- **Rich text:** TipTap (with underline extension)
- **Charts:** Chart.js + react-chartjs-2
- **Excel export:** xlsx (SheetJS)
- **Notifications:** react-hot-toast
- **Security:** react-google-recaptcha (v3)
- **Extras:** canvas-confetti, react-snowfall, lucide-react, react-icons
- **Font:** Inter (400/600/700, regular + italic)

## Directory Layout

```
src/
├── app/              Redux store + route configuration
├── components/       Reusable UI (~76 components: modals, forms, layout, ui kit)
├── constants/        Static data (candidate stages, languages, regions, document metadata)
├── features/         Redux slices (authSlice)
├── firebase/         Firebase SDK initialization and config
├── hooks/            Cross-cutting hooks (auth, theme, role, collection, device)
├── layouts/          MainLayout (Navbar + Sidebar + Outlet) + SettingsLayout + CandidatesLayout
├── pages/            Route-level pages and their feature-specific hooks/components
│   ├── generate/         Candidate profile editor (split into 30+ sections/hooks)
│   ├── collectionCv/     Candidate list view with filters, stats, pagination
│   ├── create/           Public multi-step candidate registration form
│   ├── candidates/       Archive, deleted users, archived directions
│   ├── settings/         Admin settings (admins, telegram, directions, email templates, PDFs)
│   ├── documents/        15 document template editors with live PDF preview
│   ├── dataExchange/     Public page for candidates to exchange documents
│   ├── Home.jsx          Berufsfelder (job fields) table
│   ├── Statistics.jsx    Live + all-time stats with Excel export
│   ├── Profile.jsx       Current user's profile editor
│   └── Login.jsx         Auth with reCAPTCHA
├── utils/            File upload, collections CRUD, Excel export, address parsing, formatters
├── index.css         Tailwind layers, DaisyUI themes, Inter font, TipTap styles
└── main.jsx          Entry point (Redux Provider, Toaster, Router)
```

## Routing (`src/app/routeConfig.jsx`)

All routes are auth-protected except `/login`, `/create`, and `/dataExchange/:id` (link-gated).

| Route | Page | Access | Purpose |
|---|---|---|---|
| `/` | Home | Auth | Job fields (Berufsfelder) table, counts, link toggles |
| `/statistics` | Statistics | Auth | Live + historical stats, Excel export |
| `/profile` | Profile | Auth | Current user profile (display name, avatar, contact) |
| `/collectionCv/:major` | CollectionCv | Auth | Candidate table for a major with filters/pagination |
| `/generate/:major/:id` | Generate | Auth | Full candidate editor + live CV preview + documents |
| `/candidates/` | CandidatesLayout | Admin | Archive hub |
| `/candidates/all` | CandidatesAllUsers | Admin | All active candidates (disabled in UI) |
| `/candidates/archived` | CandidatesArchivedUsers | Admin | Soft-deleted candidates, restore |
| `/candidates/deleted` | CandidatesDeletedUsers | Admin | Permanently deleted (audit) |
| `/candidates/archived-directions` | CandidatesArchivedDirections | Admin | Archived job fields |
| `/settings/` | SettingsLayout | Admin | Settings hub |
| `/settings/admins` | AdminsSettings | Super admin | Assign/revoke admin roles |
| `/settings/telegram-groups` | TelegramGroupsSettings | Admin | Telegram group invite links |
| `/settings/telegram-channels` | TelegramChannelsSettings | Admin | Telegram channel configuration |
| `/settings/directions` | DirectionsSettings | Admin | Manage Berufsfelder metadata |
| `/settings/template-emails` | TemplateEmailsSettings | Admin | Per-stage email templates |
| `/settings/fillable-pdf-defaults` | FillablePdfDefaultsSettings | Admin | Pre-fill defaults for Zusatzblatt A–D |
| `/settings/documents` | DocumentsSettings | Admin | Document template index |
| `/settings/documents/:docId` | (15 editors) | Admin | Live-preview template editors |
| `/login` | Login | Public | Email/password + reCAPTCHA |
| `/create` | Create | Public (linkId) | Multi-step candidate registration |
| `/dataExchange/:id` | DataExchange | Public (link) | Candidate ↔ admin document exchange |
| `*` | NotFound | — | 404 fallback |

## Layout

- **Navbar** — top, present on all pages. Links: Home, Statistiken, Profil, Einstellungen, Kandidaten. Houses theme toggle and user menu.
- **Sidebar** — slide-in panel on the left. Lists majors with action buttons. Present on every page **except** Home.
- **Home** — majors rendered as a full-width table; no sidebar toggle.
- **MainLayout** wraps Navbar + Sidebar + `<Outlet />`.
- **SettingsLayout** provides nested settings nav.

## Pages & Features

### Home (`/`)
- Table of job fields (Berufsfelder) with live candidate counts from Firestore.
- Actions per row: copy registration link, toggle link active, edit metadata, delete (with confirmation).
- Create new job field (non-limited admins).
- `useMajorsData()` manages data + modals.

### Statistics (`/statistics`)
- **Live stats** — real-time Firestore snapshots across all majors.
- **All-time stats** — aggregated from `stats/global` document (persists through deletions).
- Breakdowns: total, by stage, by outcome, by age group, by language level, by driving license, by certification, by reaction.
- Excel export of all candidates (filterable, multi-sheet).
- Hooks: `useLiveStats`, `useGlobalStats`, `useExportCandidates`, `useCollectionNames`.

### CollectionCv (`/collectionCv/:major`)
- Compact candidate table, **10 per page** with customizable pagination.
- **Multi-filter** (10 dimensions): certificate, experience, comment, stage, stage outcome, age, driving license, language level, rating, reactions.
- Search by name.
- Reactions (thumbs up/down) with commenter avatars.
- Comment-author filter.
- Row actions: view, delete/archive, favorite (star).
- Excel export of filtered list.
- Status column uses short format: `1-bosqich`, `2-bosqich`, `3-bosqich`, `4-bosqich`.
- `Erstellt` column shows date only (`DD.MM.YYYY`), no time.
- Missing email renders as `—`.
- Lead and Telegram fields are intentionally hidden from the table.

### Generate (`/generate/:major/:id`)
Full candidate editor, split-pane: form on the left, live PDF preview on the right.

**Sections:**
- Header (name, status badge, last edit)
- Personal info (name, gender, birth date/place, marital status, children, photo, contact)
- Address (German address parser + postal code validation by region)
- Languages (level + certificate upload)
- Education (school, graduation year, field)
- Experience (title, company, duration, description)
- Skills (searchable tag input)
- Documents (CV, passport, certificates)
- **Incoming documents** — PDFs sent to the candidate (Beratungsvertrag, Vermittlungsvertrag, etc.), tracked with timestamps
- **Outgoing documents** — files the candidate uploaded back (download, delete individual or all)
- Comments (TipTap rich text, author, timestamp, reactions)
- Status & stage (stage selector with outcome; triggers automated emails)
- Remote mode (read-only view of external source, two-way restore)

**Behavior:**
- Unsaved-changes warning on navigation.
- Form normalization (capitalize address, format phone, normalize passport).
- Auto-save with debounce.
- Watermark toggle and 1–5 star rating on the live CV.
- 50+ feature hooks under `src/pages/generate/hooks/`.

### Create (`/create`) — Public registration
- Multi-step form: Personal → Education → Languages → Skills → Documents.
- Step validation with error feedback + step progress indicator.
- Live PDF CV preview (desktop).
- Modals: Privacy, Guide, Required Documents, PDF preview, Photo upload, Email verify, Passport verify, Telegram invite.
- Mobile bottom sheets for pickers (city, country, birth place, marital status).
- Duplicate check (email + passport) before submit.
- Telegram group invitation after submit.
- Confetti + "Thank You" card on success.
- Blocked-link page if `linkActive` is false.

### DataExchange (`/dataExchange/:id`)
- Public link page. Shows candidate name, outgoing docs for download, incoming-doc uploader, optional delete.

### Profile (`/profile`)
- Current user's avatar (custom upload or DiceBear initials fallback), display name, email, contact info. Syncs to `users/` collection.

### Candidates Archive (`/candidates/*`)
- `archived` — soft-deleted with restore.
- `deleted` — permanent audit trail.
- `archived-directions` — archived job fields history.

### Settings (`/settings/*`)
- **Admins** — manage custom-claim roles (admin / super_admin / limited_admin).
- **Telegram Groups / Channels** — invite links and notification channels.
- **Directions** — CRUD for Berufsfelder (title, description, active flag).
- **Template Emails** — per-stage subject/body with variables (`{firstName}`, etc.) and preview.
- **Fillable PDF Defaults** — pre-fill defaults for Zusatzblatt A/B/C/D.
- **Documents** — index + live-preview editor for each of the 15 templates.

## Document Generation

PDFs are generated in the browser with `@react-pdf/renderer`; fillable PDFs use `pdfjs-dist`.

**Generated PDF templates (live-preview editors):**
1. Beratungsvertrag (consulting contract)
2. Vermittlungsvertrag (placement contract)
3. Vollmacht (PoA — candidate → broker)
4. Vollmacht Arbeitgeber (PoA — candidate → employer, §81a AufenthG)
5. Rozilik xati (parental consent, UZ/DE)
6. Nomzod rozilik xati (candidate consent, UZ/DE)
7. Mitarbeiterwohnung (employer housing confirmation)
8. Sprachsbestätigung (language-level certification)
9. Einwilligungserklärung (GDPR consent)
10. Foto/Video Rozilik (photo/video usage consent, UZ/DE)
11. Personalfragebogen (personnel questionnaire)

**Fillable PDFs (form-field pre-population):**
12. Erklärung Beschäftigung
13. Zusatzblatt A (credential recognition)
14. Zusatzblatt B (ICT / personnel transfer)
15. Zusatzblatt C (professional truck driver)
16. Zusatzblatt D (short-term ≤ 90d / 8mo)
17. Beschäftigungsverhältnis (employment relationship)

**Flow:**
1. Admin edits template in `/settings/documents/{id}` with live preview.
2. Admin generates the document from `/generate/:major/:id`.
3. Document stored in `outgoing_documents` subcollection; email link sent to candidate.
4. Candidate downloads via `/dataExchange/:id`, uploads signed version back.
5. Admin retrieves from the incoming-documents section.

**CV PDF:** live preview, optional watermark background, star-rating badge, embedded photo and signature, auto-paginated comments.

## Candidate Status Stages (`src/constants/candidateStatus.js`)

| Key | Short label | Meaning | Badge |
|---|---|---|---|
| `stage_1` | 1-bosqich | Internal interview pending | primary |
| `stage_2` | 2-bosqich | Internal interview result | info |
| `stage_2_result` | 2-bosqich+ | Management review result | info |
| `stage_3` | 3-bosqich | Employer interview invitation | warning |
| `stage_4` | 4-bosqich | Employer decision | success |

Each stage has an outcome (`accepted` / `rejected`) which triggers the corresponding email template.

## Comments & Reactions
- TipTap rich-text editor with per-comment author (`updatedByName`, `updatedByUid`) and timestamp.
- Reactions: thumbs up / thumbs down with commenter avatar and count.
- Avatars resolved from the `users` collection with DiceBear initials fallback; cached locally.
- `limited_admin` sees reactions read-only.
- Default comment template pre-fills sections (Language level, Experience, Motivation, Family, etc.).
- Comments auto-paginate in the generated PDF.

## Firestore Collections

| Collection | Purpose |
|---|---|
| `meta` | Job field (Berufsfeld) metadata: uuid, name, title, linkActive, linkId, createdAt |
| `{collectionName}` | Candidates in a specific job field |
| `cv_index/{collectionName}/items` | Read-only list projection (~0.8 KB/candidate) powering CollectionCv; maintained by the `syncCandidateListIndex` trigger |
| `archived_users` | Soft-deleted candidates |
| `deleted_users` | Permanently deleted candidates (audit) |
| `users` | Admin user profiles (displayName, photoURL, avatar, lastLogin) |
| `stats/global` | Aggregated all-time statistics |
| `settings/admins` | Admin list with roles |
| `settings/telegram_groups` | Telegram invite groups |
| `settings/telegram_channels` | Telegram notification channels |
| `settings/email_templates` | Email templates per stage |
| `settings/fillable_pdf_defaults` | Defaults for Zusatzblatt A–D |

## Auth & Roles
- Firebase Auth email/password with reCAPTCHA v3 on login.
- Custom-claim roles: `super_admin`, `admin`, `limited_admin`.
- `authReady` flag in Redux prevents redirect flicker on app boot.
- User sync to `users/` collection on auth-state change.

## Redux Store
Single slice only:
- **`authSlice`** — `{ user, authReady }` with `login` / `logout` / `setAuthReady`. Serializable check disabled (Firebase objects).

## Custom Hooks

**Root (`src/hooks/`):**
- `useUserRole()` — role + loading state from custom claims.
- `useTheme()` — `winter`/`dracula` toggle with localStorage persistence.
- `useLogin()` / `useLogout()` — Firebase auth actions with pending/error state.
- `useDesktopOnly()` — `{ isMobile, isTablet, isDesktop }`.
- `useCollection()` — generic Firestore collection subscription.

**Feature hooks:** 50+ hooks under `src/pages/generate/hooks/`, 10+ under `collectionCv/hooks/`, plus statistics and create-page hook groups.

## Design Rules

- Use DaisyUI semantic colors only: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `neutral`.
- **Do not** use inline colors (`#a855f7`, `#0088cc`, `text-green-600`, etc.). Replace with DaisyUI semantic tokens.
- Table header: `bg-neutral text-neutral-content`.
- Table border: `rounded-xl border border-base-300 shadow-sm`.
- Avatar placeholder: `bg-neutral text-neutral-content`.
- Row hover: `hover:bg-primary/5`.
- Every icon must have a tooltip (`title` attribute).

## Code Rules

- **Max 200 lines per file.** Split larger files into sections/hooks/components.
- Desktop-only; no mobile responsiveness required for admin views (the public `/create` flow is the exception — it is mobile-optimized).
- CollectionCv shows 10 candidates per page (paginated).
- Status column uses the short format (`1-bosqich` … `4-bosqich`).
- `Erstellt` column: date only (`DD.MM.YYYY`).
- Missing email → `—`.
- Lead and Telegram fields are not shown in candidate tables.

## Localization

- No i18n library. UI text is hardcoded in German.
- Uzbek is used for candidate-facing consent forms (Rozilik xati, Nomzod rozilik xati, Foto/Video Rozilik) and select labels.
- Date format: `DD.MM.YYYY`. Time zone: Asia/Tashkent.
- Language-level options (A1–C2) and regional data in `src/constants/`.

## Theming & Seasonal UI

- DaisyUI themes via `data-theme`, persisted to localStorage (`consulting-admin-theme`).
- `ThemeBootstrap` applies the stored/system-preferred theme on mount.
- Seasonal extras: `WinterSnowfall` (react-snowfall) and `SeasonalBackground` render conditionally.

## Key Files

- `src/app/routeConfig.jsx` — route tree and lazy loading.
- `src/layouts/MainLayout.jsx` — Navbar + Sidebar + Outlet.
- `src/components/Navbar.jsx` — top navigation + theme toggle.
- `src/components/Sidebar.jsx` — slide-in majors panel.
- `src/pages/Home.jsx` — Berufsfelder table.
- `src/pages/Statistics.jsx` — live + historical stats.
- `src/pages/CollectionCv.jsx` — candidate table.
- `src/pages/collectionCv/CollectionStatistics.jsx` — badge stats.
- `src/pages/collectionCv/hooks/useCollectionFilters.js` — filters + pagination (10/page).
- `src/pages/generate/Generate.jsx` — candidate editor root (delegates to hooks/sections).
- `src/constants/candidateStatus.js` — stage definitions and labels.
- `src/features/authSlice.js` — auth state.
- `src/firebase/config.js` — Firebase SDK initialization.
- `src/index.css` — Tailwind + DaisyUI themes + Inter font + TipTap styles.

## External Integrations

- **Email:** Brevo (via Cloud Functions) for stage-based automated emails.
- **Telegram Bot API:** group invitations after registration, channel notifications.
- **reCAPTCHA v3:** login protection.
- **DiceBear:** auto-generated avatar fallback.
- **Google Fonts:** Inter.
- **Firebase Cloud Functions:** `submitCandidate` plus email/PDF/notification helpers.
- **Firebase Cloud Storage:** candidate photos, uploaded documents, generated PDFs.
