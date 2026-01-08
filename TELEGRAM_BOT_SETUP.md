# Telegram Bot Setup Guide

## Overview

The Telegram bot generates registration links with major codes and Telegram IDs for candidates..

## Flow

1. Admin opens a Berufsfeld (major) and clicks the copy link button
2. A modal appears with two options:
   - **Regular Link**: Direct registration link
   - **Telegram Link**: Deep link to the bot (e.g., `https://t.me/consultinguz_bot?start=kfz_mechatroniker_2026`)
3. When a candidate clicks the Telegram link:
   - Bot extracts the major code from the deep link parameter
   - Bot generates a personalized registration link with the candidate's Telegram ID
   - Example: `https://admin.consultinguz.de/create?major=kfz_mechatroniker_2026&telegramId=123456789`
4. Candidate uses the link to register

## Bot Configuration

### 1. Set Bot Token Secret

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
```

### 2. Set Webhook URL

After deploying the functions, set the webhook URL for your bot:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://us-central1-<YOUR_PROJECT_ID>.cloudfunctions.net/telegramBotWebhook"}'
```

Replace:

- `<YOUR_BOT_TOKEN>` with your actual bot token
- `<YOUR_PROJECT_ID>` with your Firebase project ID

### 3. Verify Webhook

Check webhook status:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Bot Commands

### /start

Handles deep links with major codes.

**Example:**

```
/start kfz_mechatroniker_2026
```

Bot response:

- Extracts `kfz_mechatroniker_2026` as the major code
- Gets user's Telegram ID
- Generates registration link: `https://admin.consultinguz.de/create?major=kfz_mechatroniker_2026&telegramId=123456789`
- Sends link to user with inline button

### /help

Shows help information about the bot.

## Frontend Integration

### LinkCopyModal Component

Located at: `src/components/LinkCopyModal.jsx`

Shows two copy options:

1. **Regular Link**: Standard registration link
2. **Telegram Link**: Bot deep link with major code

### MajorsList Component

Updated to use `LinkCopyModal` instead of directly copying links.

## Database Collections

### bot_interactions

Stores bot interaction logs:

```javascript
{
  telegramId: number,
  username: string,
  firstName: string,
  majorCode: string,
  registrationLink: string,
  timestamp: Date
}
```

## Testing

### Local Testing

1. Deploy functions: `npm run deploy`
2. Set webhook URL (see step 2 above)
3. Send a message to your bot on Telegram
4. Check Firebase Functions logs: `firebase functions:log`

### Test Deep Link

1. Create a test link: `https://t.me/consultinguz_bot?start=test_major_2026`
2. Click the link on Telegram
3. Bot should respond with a registration link containing your Telegram ID

## Troubleshooting

### Bot not responding

- Check webhook status with `getWebhookInfo`
- Verify `TELEGRAM_BOT_TOKEN` secret is set
- Check Firebase Functions logs for errors

### Deep link not working

- Ensure major code format is correct (no spaces, use underscores)
- Check bot logs in Firestore `bot_interactions` collection
- Verify the major exists in the `meta` collection

### Webhook errors

- Ensure webhook URL is accessible (HTTPS required)
- Check Firebase Functions deployment status
- Verify bot token is valid

## Security Notes

- Bot token is stored as a Firebase secret (never in code)
- Webhook endpoint validates incoming requests
- Telegram IDs are logged for tracking but not exposed publicly
- Registration links are generated server-side only

## Deployment Checklist

- [ ] Set `TELEGRAM_BOT_TOKEN` secret
- [ ] Deploy Firebase Functions
- [ ] Set webhook URL
- [ ] Verify webhook is active
- [ ] Test bot with a sample deep link
- [ ] Check bot_interactions collection for logs
- [ ] Test frontend link copy modal
- [ ] Verify registration flow with telegramId parameter
