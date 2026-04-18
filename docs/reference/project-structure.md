# Project structure

File-tree reference with entry points. Use this when you're hunting for the right place to make a change.

---

## Root

```
consulting-admin/
├── src/                  Frontend React/Vite SPA
├── functions/            Firebase Cloud Functions (Node 20)
├── backend/              Express PDF-fill backend
├── docs/                 Documentation (you are here)
├── scripts/              Root helper scripts (seed, migrate)
├── dist/                 Built frontend — git-ignored
├── functions.rules/      (unused, historical)
├── firestore.rules       Firestore security rules
├── firestore.indexes.json Firestore composite indexes
├── storage.rules         Cloud Storage security rules
├── firebase.json         Firebase CLI config
├── firebase-storage-cors.json CORS for Cloud Storage
├── vite.config.js        Vite config
├── eslint.config.js      ESLint flat config
├── vercel.json           Optional Vercel deploy config
├── package.json          Frontend deps + scripts
├── CLAUDE.md             AI coding agent instructions
└── README.md             Project intro
```

---

## Frontend (`src/`)

```
src/
├── main.jsx                  Entry (Redux Provider, Toaster, Router mount)
├── App.jsx                   Route map + auth bootstrap + ProtectedRoutes
├── index.css                 Tailwind layers, DaisyUI themes, Inter font, TipTap styles
│
├── firebase/
│   └── config.js             Firebase SDK initialization
│
├── features/
│   └── authSlice.js          { user, authReady } Redux slice
│
├── app/
│   ├── store.js              configureStore
│   └── routeConfig.jsx       (partial route definitions)
│
├── hooks/                    Cross-cutting hooks
│   ├── useUserRole.js        Role from custom claims
│   ├── useTheme.js           winter/dracula toggle
│   ├── useLogin.js / useLogout.js
│   ├── useDesktopOnly.js     Responsive detection
│   └── useCollection.js      Firestore collection subscription
│
├── layouts/
│   └── MainLayout.jsx        Navbar + Sidebar + <Outlet />
│
├── components/               ~76 reusable components
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   ├── ProtectedRoutes.jsx
│   ├── DesktopGuard.jsx
│   ├── ErrorBoundary.jsx
│   ├── ThemeBootstrap.jsx
│   ├── SeasonalBackground.jsx, WinterSnowfall.jsx
│   ├── MajorModal.jsx, DeleteMajorModal.jsx, MajorSettingsModal.jsx
│   ├── LinkCopyModal.jsx, DeleteCandidateModal.jsx
│   ├── UnsavedChangesModal.jsx, ConfirmActionModal.jsx
│   ├── RichTextEditor.jsx (TipTap)
│   ├── CandidateCard.jsx, CandidateStatusBadge.jsx, CandidateStatusPanel.jsx
│   ├── PhoneInputWithCountry.jsx, CountryNameCombobox.jsx
│   ├── SuperAdminUserManagement.jsx
│   └── ui/                   Button, Input, NativeSelect, Textarea primitives
│
├── pages/                    Route-level pages
│   ├── Home.jsx              Berufsfelder table
│   ├── Login.jsx
│   ├── Profile.jsx
│   ├── Statistics.jsx + StatsSection.jsx
│   ├── CollectionCv.jsx
│   ├── collectionCv/         Filters, stats, pagination, hooks
│   ├── Generate.jsx          Thin wrapper → generate/index
│   ├── generate/             Modular candidate editor (see below)
│   ├── Create.jsx            Thin wrapper → create/
│   ├── create/               Modular public registration form
│   ├── DataExchange.jsx
│   ├── dataExchange/         Public document-exchange hooks/components
│   ├── NotFound.jsx
│   ├── candidates/           Archive/deleted/archived-directions pages
│   ├── settings/             All admin settings pages
│   ├── contract/             Contract rendering utilities
│   ├── [Document pages].jsx  One per PDF template (see below)
│   └── GenerateLegacy.jsx    Pre-refactor entry, kept for reference
│
├── constants/                Static data
│   ├── candidateStatus.js    Stage keys + labels + badges
│   ├── languageOptions.js    A1–C2 levels
│   ├── regions.js            Uzbekistan region/city list
│   └── documentTemplates.js  Template metadata
│
└── utils/                    Pure helpers
    ├── uploadFile.js, uploadImage.js
    ├── exportToExcel.js      xlsx export
    ├── formatDate.js, formatPhone.js
    ├── parseAddress.js       German address parsing
    └── normalize*.js         Field normalization helpers
```

### Generate module (`src/pages/generate/`)

The most complex page in the app. Split aggressively to stay under the 200-line-per-file rule.

```
src/pages/generate/
├── index/
│   ├── GeneratePage.jsx           Thin page wrapper
│   └── GeneratePageContainer.jsx  Orchestration logic
├── layout/                        Top bar, overlays, split-pane
├── sections/                      Form blocks (PersonalInfo, Education, Status, Documents, Comments, …)
├── modals/                        ModalHost + individual modal wrappers
├── hooks/                         50+ feature hooks
│   ├── useGeneratePage.js
│   ├── useCandidateSnapshot.js
│   ├── useSaveCandidate.js
│   ├── useAddressSync.js
│   ├── useOutgoingDocuments.js, useIncomingDocuments.js
│   ├── useStatusEmail.js
│   └── useRemoteRecord.js
├── utils/                         Pure helpers specific to the page
├── constants/                     Section configs, form defaults
├── mappers/                       Firestore ↔ form state mapping
├── components/                    Shared UI within generate/
└── pdf/                           CV PDF renderer (@react-pdf/renderer)
```

### Document template pages

One React component per PDF template, living directly in `src/pages/`:

- `Beratungsvertrag.jsx` (mapped internally)
- `Vermittlungsvertrag.jsx`
- `Vollmacht.jsx`, `VollmachtArbeitgeber.jsx`
- `RozilikXati.jsx`, `NomzodRozilikXati.jsx`
- `Mitarbeiterwohnung.jsx`, `Sprachsbestaetigung.jsx`
- `Einwilligungserklaerung.jsx`, `FotoVideoRozilik.jsx`
- `Personalfragebogen.jsx`
- `ErklaerungBeschaeftigung.jsx`
- `Zusatzblatt[A-D].jsx`
- `Beschaeftigungsverhaeltnis.jsx`
- `Contract.jsx` — shared contract scaffolding

Each renders with `@react-pdf/renderer` (except the fillable ones, which call the PDF backend).

---

## Cloud Functions (`functions/`)

```
functions/
├── index.js                  All exported endpoints/triggers/callables
├── package.json
└── src/
    ├── services/
    │   └── telegram.js       Telegram integration helpers
    ├── downloadProxy.js      CORS-safe download proxy
    └── scripts/              Seed + migration scripts
```

Every function is declared at the top of `index.js` and implemented either inline or by delegation to `src/`. Secrets are declared with `defineSecret` at the top of the file.

---

## PDF backend (`backend/`)

```
backend/
├── server.js                 Express entry + route handlers
├── package.json
├── pdf/                      PDF templates (input)
└── analyze-pdf.js            Dev tool: dump form-field names for a template
```

---

## Docs (`docs/`)

```
docs/
├── README.md                 Index (Diátaxis)
├── tutorials/
│   └── getting-started.md
├── how-to/
│   ├── setup-recaptcha.md
│   ├── setup-telegram-bot.md
│   ├── configure-telegram-auto-remove.md
│   ├── add-new-major.md
│   ├── add-document-template.md
│   ├── manage-admin-roles.md
│   └── deploy-to-production.md
├── reference/
│   ├── routes.md
│   ├── cloud-functions.md
│   ├── firestore-collections.md
│   ├── storage-paths.md
│   ├── environment-variables.md
│   ├── security-rules.md
│   ├── candidate-stages.md
│   ├── admin-roles.md
│   └── project-structure.md  (this file)
└── explanation/
    ├── architecture.md
    ├── candidate-lifecycle.md
    ├── document-generation.md
    ├── security-model.md
    └── localization.md
```

---

## Entry points by task

| Task | Start file |
|---|---|
| Add a route | [src/App.jsx](../../src/App.jsx) |
| Change the main layout | [src/layouts/MainLayout.jsx](../../src/layouts/MainLayout.jsx) |
| Add a top-nav link | [src/components/Navbar.jsx](../../src/components/Navbar.jsx) |
| Change candidate fields | `src/pages/generate/sections/` + mappers |
| Add a new document template | See [../how-to/add-document-template.md](../how-to/add-document-template.md) |
| Change stage labels/colors | [src/constants/candidateStatus.js](../../src/constants/candidateStatus.js) |
| Add a Firestore collection | [firestore.rules](../../firestore.rules) + reference doc |
| Add a Cloud Function | `functions/index.js` + [cloud-functions.md](cloud-functions.md) |
| Change styling globally | [src/index.css](../../src/index.css) |
| Add an env var | `.env.local` + [environment-variables.md](environment-variables.md) |
