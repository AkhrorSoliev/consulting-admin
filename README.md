# Consulting Admin

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> Admin dashboard for an international employment consultancy placing candidates from Uzbekistan into skilled jobs in Germany. Manages the full candidate lifecycle — registration, internal interviews, document generation, and employer placement.

## What it does

- **Candidate pipeline** — public registration link → internal review → employer interview → placement, tracked across 4 stages with automated emails.
- **Document generation** — 17 German legal document templates (Beratungsvertrag, Vermittlungsvertrag, Vollmacht, Zusatzblatt A–D, etc.) with live PDF preview and email delivery.
- **Two-way document exchange** — candidates upload signed documents back via unique link.
- **Real-time statistics** — live + historical metrics across all job fields (Berufsfelder).
- **Role-based administration** — `super_admin` / `admin` / `limited_admin` with granular permissions.
- **Telegram integration** — bot-generated personalized registration links, one-time group invites, auto-remove on placement.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Redux Toolkit, Vite 7 |
| Styling | Tailwind CSS v4, DaisyUI 5 (themes: `winter` / `dracula`) |
| Backend | Firebase Cloud Functions v2 (Node 20), Firestore, Auth, Cloud Storage |
| PDF backend | Express service with `pdf-lib` (fillable PDF templates) |
| Client PDF | `@react-pdf/renderer` for generated contracts, `pdfjs-dist` for fillable forms |
| Forms | React Hook Form, TipTap rich text editor |
| Integrations | Telegram Bot API, Brevo (email), reCAPTCHA v2, OpenAI (proxied) |

## Quick start

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- Firebase project access

### Install

```bash
# Root (frontend)
npm install

# Cloud Functions
cd functions && npm install && cd ..

# PDF backend
cd backend && npm install && cd ..
```

### Configure

Create `.env.local` in the repo root. See [docs/reference/environment-variables.md](docs/reference/environment-variables.md) for the full list of keys.

Set server-side secrets for Cloud Functions:

```bash
cd functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set OPENAI_API_KEY
```

### Run

```bash
npm run dev                      # frontend at http://localhost:5173
cd backend && npm run dev        # PDF backend at http://localhost:3001
cd functions && npm run serve    # (optional) Functions emulator
```

### Build

```bash
npm run build    # output in dist/
```

## Documentation

Full documentation lives in [`docs/`](docs/) and is organized by the [Diátaxis framework](https://diataxis.fr/):

| Type | When to read |
|---|---|
| 📚 [Tutorials](docs/tutorials/) | You're new — step-by-step walkthroughs |
| 🔧 [How-to guides](docs/how-to/) | You have a specific task to accomplish |
| 📖 [Reference](docs/reference/) | You need precise technical facts |
| 💡 [Explanation](docs/explanation/) | You want to understand why |

Start at [docs/README.md](docs/README.md) for the full index.

> [!IMPORTANT]
> If code and docs disagree, code is authoritative. When you refactor, update the affected docs in the same PR.

## Project layout

```
consulting-admin/
├── src/                  # React frontend (SPA)
├── functions/            # Firebase Cloud Functions (Node 20)
├── backend/              # Express PDF-fill backend
├── docs/                 # All documentation (see above)
├── firestore.rules       # Firestore security rules
├── storage.rules         # Cloud Storage security rules
└── firebase.json         # Firebase config
```

See [docs/reference/project-structure.md](docs/reference/project-structure.md) for detail.

## License

Private. All rights reserved.
