# API Reference

This repository exposes APIs from:
- Firebase Cloud Functions (`functions/index.js`)
- Express PDF backend (`backend/server.js`)

## 1. Base URLs

### Firebase Functions HTTP
- Format: `https://<region>-<project>.cloudfunctions.net/<name>`
- Frontend usually builds URLs from `VITE_FUNCTIONS_BASE`

### Firebase callable
- Invoked with Firebase SDK `httpsCallable(functions, "name")`
- Requires authenticated Firebase user context

### PDF backend
- Local default: `http://localhost:3001`
- Frontend key: `VITE_PDF_BACKEND_URL`

## 2. Functions HTTP endpoints

| Name | Method | Auth | Purpose |
|---|---|---|---|
| `health` | GET | Public | Service health check |
| `downloadProxy` | GET | Public | Proxy PDF download with filename headers |
| `proxyPdf` | GET | Public | CORS-safe PDF proxy |
| `checkRegistry` | POST | Public | Duplicate checks (email/passport/telegram) |
| `submitCandidate` | POST | Public + reCAPTCHA | Create candidate with duplicate protection |
| `generateInvite` | POST | Admin | Telegram group invite link |
| `generateChannelInvite` | POST | Admin | Telegram channel invite link |
| `trackInviteSent` | POST | Admin | Increment invite counters |
| `telegramGroupsFromUpdates` | GET | Admin | Read chats/channels from bot updates |
| `removeTelegramGroupMember` | POST | Admin | Remove one user from one group |
| `getTelegramGroupMembers` | GET | Admin | Get chat admin/member list |
| `removeUserFromTelegramGroups` | POST | Admin | Remove user from all active groups |
| `telegramBotWebhook` | POST | Telegram webhook | Bot callback receiver |
| `sendTelegramMessage` | POST | Admin | Direct Telegram message send |
| `debugMajors` | GET | Public/debug | Dump active directions metadata |
| `countState1Candidates` | GET | Public/debug | Aggregate stage counts |
| `openaiProxy` | POST | Admin | Proxy OpenAI chat completions |

## 3. Callable functions

| Name | Role | Purpose |
|---|---|---|
| `listUsers` | `super_admin` | List auth users |
| `createUser` | `super_admin` | Create auth user |
| `deleteUser` | `super_admin` | Delete auth user |
| `disableUser` | `super_admin` | Disable user |
| `enableUser` | `super_admin` | Enable user |
| `setUserPassword` | `super_admin` | Reset password |
| `setUserRole` | `super_admin` | Set custom role claim |
| `sendInviteToCandidate` | `admin`/`super_admin` | Send Telegram invite to candidate |
| `kickCandidate` | `admin`/`super_admin` | Kick candidate from group |

## 4. Firestore trigger functions

| Name | Trigger | Purpose |
|---|---|---|
| `syncEmailAndPassIdRegistry` | `onDocumentWritten({collectionId}/{docId})` | Keep duplicate registry synced |
| `syncRemoteAllUsers` | `onDocumentWritten({collectionId}/{docId})` | Sync candidate data to remote mirror |

## 5. PDF backend endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/health` | GET | Public | Service health |
| `/templates` | GET | Public | List templates in `backend/pdf/` |
| `/analyze/:filename` | GET | Public | Inspect form fields |
| `/generate-pdf` | POST | Public | Fill and return PDF |

## 6. Integration surfaces
- Telegram Bot API (`api.telegram.org`)
- OpenAI Chat Completions (proxied by `openaiProxy`)
- Brevo mail bridge service
- `json-api.uz` remote registry/mirror endpoints

## 7. Contract notes
- Most failures return `{ ok: false, error, details? }`.
- Auth failures: `401` / callable `permission-denied`.
- Validation failures: `400`.
- Duplicate conflicts in submit flow: `409`.
