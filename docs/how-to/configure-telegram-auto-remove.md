# How to configure Telegram auto-remove on rejection

When a candidate is rejected at any stage, the app can automatically remove them from every active Telegram group the bot administers. This guide walks through enabling and verifying the flow.

**You need this when:** rolling out to a new environment, debugging why rejected candidates are lingering in groups, or onboarding a new group and wanting it in the auto-remove rotation.

---

## Prerequisites

- Telegram bot already set up — see [setup-telegram-bot.md](setup-telegram-bot.md).
- `TELEGRAM_BOT_TOKEN` secret configured.
- At least one entry in Firestore `telegram_groups` with `active: true`.
- The bot must be an **administrator** in each of those groups with the `can_restrict_members` permission.

---

## How the flow works

```
Admin clicks "Reject" on stage X outcome in /generate/:major/:id
  ↓
Frontend sends rejection email (Brevo)
  ↓
Frontend POSTs to /removeUserFromTelegramGroups
  { "telegramId": "123456789" }
  ↓
Function iterates Firestore telegram_groups where active == true
  For each group:
    1. Telegram banChatMember (chat_id, user_id)
    2. Telegram unbanChatMember (chat_id, user_id)   ← allows future re-invite
  ↓
Returns per-group success/failure list
  ↓
Frontend shows toast: "Removed from X of Y groups"
```

The ban-then-unban pattern is the standard Telegram idiom for kicking a user. `banChatMember` alone would leave them banned, preventing re-invitation if they re-apply later.

---

## Step 1 — Verify group configuration

Open Firestore (console or via the admin UI):

```
telegram_groups/
  <doc-id>
    name: "Gruppe Berlin"
    chat_id: "-1001234567890"
    active: true
    linksSentCount: 47
```

Each group that should be in the rotation needs `active: true`. Inactive groups are skipped.

---

## Step 2 — Verify bot permissions in each group

For each active group:

1. Open the group in Telegram.
2. Group name → **Manage Group** → **Administrators**.
3. Find the bot → toggle permissions:
   - **Ban users** ✅ (required for removal)
   - **Invite users via link** ✅ (required for invite generation)
   - Others optional.

Without "Ban users," the removal endpoint returns `Bad Request: not enough rights to restrict/unrestrict chat member`.

---

## Step 3 — Verify function deployment

```bash
firebase functions:list | grep -E "(removeUserFromTelegramGroups|removeTelegramGroupMember)"
```

Both functions should appear. If they don't, deploy:

```bash
firebase deploy --only functions:removeUserFromTelegramGroups,functions:removeTelegramGroupMember
```

---

## Step 4 — Test end-to-end

Use a test candidate with a known `telegramId`:

1. Add the test user to each active group (via invite or manually).
2. Open the candidate in `/generate/:major/:id`.
3. Change stage outcome to `rejected`.
4. Watch the toast: "Removed from X of Y groups."
5. Verify in Telegram that the user is no longer in the groups.

### Direct API test

```bash
TOKEN=$(firebase auth:export users.json --format=json | ...)  # get admin ID token
curl -X POST "https://us-central1-<PROJECT>.cloudfunctions.net/removeUserFromTelegramGroups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"123456789"}'
```

Expected response:

```json
{
  "ok": true,
  "total": 3,
  "removed": 2,
  "failed": 1,
  "results": [
    { "group_id": "abc", "group_name": "Gruppe 1", "chat_id": "-1001...", "success": true },
    { "group_id": "def", "group_name": "Gruppe 2", "chat_id": "-1002...", "success": false, "error": "USER_NOT_PARTICIPANT", "was_not_member": true },
    { "group_id": "ghi", "group_name": "Gruppe 3", "chat_id": "-1003...", "success": true }
  ]
}
```

---

## Troubleshooting

### `USER_NOT_PARTICIPANT` for every group

The candidate was never added to any group. This is normal if the candidate registered but declined the Telegram invite. The flow treats these as benign and continues.

### `Bad Request: not enough rights`

Bot is not an admin in the group, or lacks `can_restrict_members`. Go back to step 2.

### No results (empty list)

No active groups in `telegram_groups`. Add at least one or switch some to `active: true`.

### User is removed but not from all groups

Check the `results[]` array. Groups with `success: false` and an `error` string need investigation — usually a permission or chat-id issue on that specific group.

### User re-appears after removal

The ban-then-unban is near-instantaneous; if you see them staying, the unban didn't happen. Check Function logs for errors between the two API calls.

---

## Rollback

If auto-remove is causing problems:

1. Toggle `active: false` on all groups in `telegram_groups` — the function still runs but finds no targets.
2. Or, comment the `removeUserFromTelegramGroups` call in the rejection handler in `src/pages/generate/` — safer if you want to keep invites working.

Remember to re-enable once the issue is fixed.

---

## See also

- [setup-telegram-bot.md](setup-telegram-bot.md) — bot + webhook setup
- [../reference/cloud-functions.md](../reference/cloud-functions.md) — `removeUserFromTelegramGroups` contract
- [../explanation/candidate-lifecycle.md](../explanation/candidate-lifecycle.md) — where rejection fits in the pipeline
