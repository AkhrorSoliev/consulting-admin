# Project Map

Repository root structure:

```text
consulting-admin/
  src/                      # Frontend app (React/Vite)
  functions/                # Firebase Functions backend
  backend/                  # Express PDF backend
  docs/                     # Project documentation
  scripts/                  # Root helper scripts
  firestore.rules           # Firestore security rules
  storage.rules             # Storage security rules
  firebase.json             # Firebase config
  vite.config.js            # Vite config
```

## Frontend map (`src/`)
- `main.jsx` - bootstrap
- `App.jsx` - route map and auth bootstrap
- `firebase/config.js` - Firebase SDK initialization
- `features/authSlice.js` - auth state
- `components/` - shared UI
- `pages/` - route pages

### Key frontend domains
- `pages/settings/` - admin/settings surfaces
- `pages/candidates/` - candidate index/archive/deleted views
- `pages/dataExchange/` - public candidate document exchange
- `pages/contract/` - contract and PDF pages
- `pages/generate/` - modularized generate feature

### Generate module map (`src/pages/generate/`)
- `index/` - page entry and container
- `layout/` - page-level composition/layout blocks
- `sections/` - form/status/document/comment sections
- `modals/` - modal host + modal wrappers
- `hooks/` - reusable generate-specific hooks
- `utils/` - utility helpers
- `constants/`, `mappers/`, `components/`, `pdf/`

## Functions map (`functions/`)
- `index.js` - exported endpoints/triggers/callables
- `src/services/telegram.js` - Telegram integration helper
- `src/downloadProxy.js` - CORS-safe download proxy helper
- `scripts/` - seed/migration scripts

## PDF backend map (`backend/`)
- `server.js` - Express entry
- `pdf/` - PDF templates
- `analyze-pdf.js` - template field analysis script
