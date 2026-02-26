# Environment

Do not commit secret values. Use `.env.local` for frontend and Firebase Secrets for server-side secrets.

## 1. Frontend Vite variables

### Firebase client config
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Functions URL config
- `VITE_FUNCTIONS_BASE`
- `VITE_SUBMIT_CANDIDATE_URL` (optional override)
- `VITE_CHECK_REGISTRY_URL` (optional override)

### Public form security
- `VITE_RECAPTCHA_SITE_KEY`

### PDF backend
- `VITE_PDF_BACKEND_URL`

### Optional frontend behavior
- `VITE_BREVO_EMAIL_URL`
- `VITE_OPENAI_MOTIVATION_MODEL`
- `VITE_SNOWFALL`

## 2. Firebase Functions secrets (`defineSecret`)
Set from `functions/` directory:
```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set OPENAI_API_KEY
```

Used secrets:
- `TELEGRAM_BOT_TOKEN`
- `RECAPTCHA_SECRET_KEY`
- `OPENAI_API_KEY`

## 3. Backend service env (`backend/`)
- `PORT` (optional, defaults to `3001`)

## 4. Security notes
- Keep all server credentials in Firebase Secrets.
- Never expose OpenAI/Telegram secret keys in frontend env.
- Rotate any secret that was ever committed or leaked.
