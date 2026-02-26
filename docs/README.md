# Consulting Admin Docs

This folder is the canonical technical documentation for this repository.

## Who this is for
- Developers working on frontend, Firebase Functions, and PDF backend
- AI coding agents that need reliable structure, boundaries, and contracts

## Document index
- `ARCHITECTURE.md` - system design, runtime boundaries, and major flows
- `API.md` - Cloud Functions and PDF backend endpoints/contracts
- `RULES.md` - Firestore and Storage access model + role behavior
- `ENVIRONMENT.md` - environment variables and server-side secrets
- `SETUP.md` - local setup, run, build, and deploy steps
- `DATA_MODEL.md` - Firestore/Storage data shapes and key collections
- `PROJECT_MAP.md` - repository structure map and important entry points

## Current stack snapshot
- Frontend: React 19 + Vite + React Router + Redux (`src/`)
- Main backend: Firebase Cloud Functions v2 (`functions/index.js`)
- Secondary backend: Express + `pdf-lib` (`backend/server.js`)
- Data: Firestore + Firebase Storage
- Integrations: Telegram Bot API, OpenAI (via function proxy), Brevo bridge, `json-api.uz`

## Generate module note
- Route: `/generate/:major/:id` in `src/App.jsx`
- Entry file: `src/pages/Generate.jsx` (wrapper)
- Refactor folder: `src/pages/generate/` (`layout/`, `sections/`, `modals/`, `hooks/`, `utils/`)
- This area is actively modularized; keep docs in sync when splitting/moving files.

## Source of truth policy
- If code and docs conflict, code is authoritative.
- After refactors, update this folder in the same PR.
