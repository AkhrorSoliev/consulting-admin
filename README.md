# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules..

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project)

## Telegram one-time invite links (admin-only)

This project supports generating **one-time** Telegram group invite links via Firebase Cloud Functions.

### Firestore structure

Collection: `telegram_groups`

- docId (auto or custom)
  - `name`: string
  - `chat_id`: string (e.g. `-1001234567890`)
  - `active`: boolean
  - `createdAt`: timestamp

### Backend endpoint

- **POST** `generateInvite`
  - Body: `{ "groupId": "..." }`
  - Auth: Firebase ID token required (header `Authorization: Bearer <idToken>`)
  - Role: `admin` or `super_admin`
  - Response: `{ ok: true, invite_link, expire_date }`

Invite link parameters:

- `member_limit = 1`
- `expire_date = now + 1 hour`

### Secret: Telegram bot token

Never commit bot tokens to code or frontend.

Configure via Firebase Functions secrets:

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase deploy --only functions
```

### Admin UI

Settings → **Telegram Groups** page allows super admins to add/remove groups (stored in Firestore).