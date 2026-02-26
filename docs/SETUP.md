# Setup

## 1. Prerequisites
- Node.js 20+
- npm
- Firebase CLI (`npm i -g firebase-tools`)

## 2. Install

### Root dependencies
```bash
npm install
```

### Functions dependencies
```bash
cd functions
npm install
cd ..
```

### PDF backend dependencies
```bash
cd backend
npm install
cd ..
```

## 3. Environment
Create `.env.local` in repository root with frontend keys from `docs/ENVIRONMENT.md`.

Set Firebase secrets for Functions:
```bash
cd functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set OPENAI_API_KEY
cd ..
```

## 4. Run locally

### Frontend
```bash
npm run dev
```
Default: `http://localhost:5173`

### PDF backend
```bash
cd backend
npm run dev
```
Default: `http://localhost:3001`

### Functions emulator (optional)
```bash
cd functions
npm run serve
```

## 5. Build
```bash
npm run build
```
Output folder: `dist/`

## 6. Deploy entry points

### Frontend hosting
- Build: `npm run build`
- Firebase Hosting is configured in `firebase.json`

### Functions
```bash
cd functions
npm run deploy
```

### PDF backend
- Deploy separately from `backend/` runtime

## 7. Useful scripts

### Root
- `npm run dev`
- `npm run build`

### Functions
- `npm run serve`
- `npm run logs`
- `npm run seed:email_and_passid`

### Backend
- `npm run analyze`

## 8. Verification checklist
- Frontend loads and auth works
- `/create` and `/dataExchange/:id` open
- Functions endpoints reachable from frontend
- PDF backend `/health` and `/templates` respond
