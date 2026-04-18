# How to set up the Telegram bot

Configure the Telegram bot that generates personalized registration deep links for candidates, sends group invites, and acts as the channel for candidate ↔ admin communication.

**You need this when:** spinning up a new environment, or the bot has become unresponsive.

---

## What the bot does

- **`/start <majorCode>`** — when a candidate opens a deep link like `https://t.me/consultinguz_bot?start=kfz_mechatroniker_2026`, the bot:
  1. Extracts the major code.
  2. Captures the candidate's Telegram ID.
  3. Generates a personalized registration URL: `https://admin.consultinguz.de/create?major=kfz_mechatroniker_2026&telegramId=<id>`.
  4. Sends it back via inline button.
- **Group invites** — admins generate one-time invite links via the Settings UI; the bot API is used to issue them.
- **Auto-remove** — when a candidate is rejected, the bot removes them from all active groups (see [configure-telegram-auto-remove.md](configure-telegram-auto-remove.md)).

---

## Step 1 — Create the bot

If the bot doesn't exist yet:

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. `/newbot` → follow prompts → choose a bot name and username.
3. BotFather returns the bot token (format: `123456789:AAH...`). **This is a secret.**
4. Configure the bot:
   - `/setprivacy` → choose your bot → **Disable** (so the bot can read group messages if needed).
   - `/setjoingroups` → **Enable** (so the bot can be added to groups for invite management).
   - `/setcommands` →
     ```
     start - Start registration with a major code
     help - Show help
     ```

---

## Step 2 — Store the token as a Firebase secret

> [!WARNING]
> Never commit bot tokens. Never put them in `.env.local` (the `VITE_` prefix would expose the token in the client bundle).

```bash
cd functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
```

Paste the token and press Enter.

---

## Step 3 — Deploy the Functions

```bash
firebase deploy --only functions
```

Deploying picks up the new secret. The relevant functions are `telegramBotWebhook`, `generateInvite`, `generateChannelInvite`, `sendTelegramMessage`, and the removal endpoints.

---

## Step 4 — Register the webhook

Tell Telegram where to POST bot updates:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramBotWebhook"}'
```

Replace:
- `<BOT_TOKEN>` — the token from BotFather.
- `<PROJECT_ID>` — your Firebase project ID.

Verify:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Look for:
- `"url"` matches the URL you set.
- `"has_custom_certificate": false`
- `"pending_update_count": 0` (or very small)
- No `"last_error_message"`.

---

## Step 5 — Test the deep link

1. Open a deep link in Telegram: `https://t.me/<bot_username>?start=test_major_2026`
2. The bot should reply with a registration link containing `telegramId=<your-id>`.
3. Check Firestore: a new doc should appear in `bot_interactions` with your Telegram ID and the major code.

If nothing happens, see [Troubleshooting](#troubleshooting).

---

## Step 6 — Configure groups in the admin UI

1. Log into the admin dashboard.
2. Navigate to **Settings → Telegram Groups** (super admin only).
3. Click **Add group**.
4. Fill in:
   - **Name:** human-readable label
   - **Chat ID:** e.g., `-1001234567890` (get this from `telegramGroupsFromUpdates` or by adding the bot and checking logs)
   - **Active:** on
5. Save.

The bot must be an **administrator** in any group you want to manage. It needs permissions to `invite_users` and `ban_users` (the latter is used by the auto-remove flow).

---

## Troubleshooting

### Bot doesn't reply to `/start`

Run the webhook info check (step 4). Common issues:

- **`pending_update_count` growing:** the webhook URL returns an error. Check `firebase functions:log --only telegramBotWebhook`.
- **`last_error_message: "SSL error"`:** the webhook URL must use HTTPS and a valid cert. The `cloudfunctions.net` domain is fine.
- **`"url": ""`:** webhook was never set or got reset. Redo step 4.

### Deep link opens the bot but nothing happens

- Major code must match (case-sensitive). Check `meta` collection — the `name` field must equal the code you pass in `/start`.
- Check `functions/index.js` `telegramBotWebhook` handler logs for parse errors.

### Generated invite links fail

- **Bot is not an admin in the group.** Promote it.
- **Bot lacks `can_invite_users` permission.** Edit bot permissions in group settings.
- **Chat ID is wrong.** Super groups start with `-100`. Channels have different IDs.

### "USER_NOT_PARTICIPANT" during removal

Expected when the candidate was never in the group. The auto-remove handler tolerates this and continues.

---

## Operational notes

- Each group keeps a `linksSentCount` counter, incremented by `trackInviteSent` when an invite is handed out.
- The bot's `/start` handler logs every interaction to `bot_interactions` — useful for debugging weird candidate signups.
- Webhooks can drift: if Telegram rotates its infrastructure IP, very occasionally webhooks need to be re-registered. If updates stop flowing, step 4 first.

---

## See also

- [setup-recaptcha.md](setup-recaptcha.md) — sibling public-form security setup
- [configure-telegram-auto-remove.md](configure-telegram-auto-remove.md) — the rejection flow
- [../reference/cloud-functions.md](../reference/cloud-functions.md) — every Telegram endpoint
