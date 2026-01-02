# Telegram Guruhlaridan Avtomatik Chiqarish Tizimi

## Maqsad

Kandidat rad qilinganda (rejected) avtomatik ravishda bot admin bo'lgan **barcha Telegram guruhlaridan** chiqariladi.

## Qanday Ishlaydi

### 1. Jarayon

```
Kandidat rad qilish → Email yuborish → Telegram guruhlaridan chiqarish → O'chirish modali
```

### 2. Texnik Tafsilotlar

#### Backend (Firebase Functions)

**Yangi Endpoint:** `/removeUserFromTelegramGroups`

- **Method:** POST
- **Auth:** Admin yoki Super Admin
- **Body:** `{ telegramId: "123456789" }`
- **Response:**

```json
{
  "ok": true,
  "total": 3,
  "removed": 2,
  "failed": 1,
  "results": [
    {
      "group_id": "abc123",
      "group_name": "Gruppe 1",
      "chat_id": "-1001234567890",
      "success": true
    },
    {
      "group_id": "def456",
      "group_name": "Gruppe 2",
      "chat_id": "-1009876543210",
      "success": false,
      "error": "USER_NOT_PARTICIPANT",
      "was_not_member": true
    }
  ]
}
```

#### Frontend Integration

**Fayl:** `src/pages/Generate.jsx`

- Kandidat rad qilinganda avtomatik chaqiriladi
- Toast notification ko'rsatadi
- Xatolik bo'lsa ham davom etadi (o'chirish modali ochiladi)

#### Telegram Service

**Fayl:** `functions/src/services/telegram.js`

- `removeUserFromAllGroups()` - barcha guruhlardan chiqarish
- Firestore'dan aktiv guruhlarni oladi
- Har bir guruhdan foydalanuvchini chiqaradi
- Natijalarni qaytaradi

## O'rnatish va Deploy

### 1. Firebase Functions Deploy

```bash
cd functions
npm install
firebase deploy --only functions:removeUserFromTelegramGroups
```

yoki barcha funksiyalarni:

```bash
firebase deploy --only functions
```

### 2. Frontend Build va Deploy

```bash
npm install
npm run build
firebase deploy --only hosting
```

## Bot Sozlamalari

### Kerakli Ruxsatlar

Bot quyidagi ruxsatlarga ega bo'lishi kerak:

- ✅ Guruhda **admin** bo'lishi shart
- ✅ "Ban users" ruxsati yoqilgan bo'lishi kerak
- ✅ Firestore'da guruh `active: true` bo'lishi kerak

### Guruh Qo'shish

Guruhlar avtomatik Firestore'ga qo'shiladi:

1. Bot'ni guruhga qo'shing
2. Bot'ni admin qiling
3. Guruhda biror xabar yuboring
4. Guruh avtomatik `telegram_groups` collection'ga qo'shiladi

### Guruhni O'chirish

Agar guruhdan foydalanuvchilarni chiqarmaslik kerak bo'lsa:

```javascript
// Firestore'da guruhni nofaol qiling
telegram_groups / { groupId };
{
  active: false; // true → false
}
```

## Test Qilish

### 1. Test Guruh Yaratish

1. Telegram'da yangi guruh yarating
2. Bot'ni guruhga qo'shing
3. Bot'ni admin qiling ("Ban users" ruxsati bilan)
4. Guruhda biror xabar yuboring

### 2. Test Foydalanuvchi

1. Test foydalanuvchini yarating (Telegram ID bilan)
2. Foydalanuvchini guruhga qo'shing
3. Admin panelda foydalanuvchini rad qiling (reject)
4. Natijani kuzating:
   - Toast notification: "Foydalanuvchi guruhlaridan chiqarilmoqda..."
   - Toast success: "Foydalanuvchi X ta guruhdan chiqarildi"
   - Console'da batafsil natija

### 3. Ko'p Guruhda Test

1. Bot'ni 2-3 ta guruhga qo'shing
2. Test foydalanuvchini barcha guruhlarga qo'shing
3. Rad qiling va natijani tekshiring
4. Barcha guruhlardan chiqarilganligini tasdiqlang

## Xatoliklarni Hal Qilish

### Foydalanuvchi chiqarilmasa:

1. ✅ Bot guruhda admin ekanligini tekshiring
2. ✅ Bot'da "Ban users" ruxsati borligini tasdiqlang
3. ✅ Firestore'da guruh `active: true` ekanligini tekshiring
4. ✅ Foydalanuvchi haqiqatan guruhda ekanligini tasdiqlang

### "USER_NOT_PARTICIPANT" xatoligi:

Bu normal - foydalanuvchi guruhda emas. Tizim buni ignore qiladi.

### "CHAT_ADMIN_REQUIRED" xatoligi:

Bot guruhda admin emas. Bot'ni admin qiling.

### Firestore'da guruh yo'q:

Guruhda biror xabar yuboring - avtomatik qo'shiladi.

## Bir Nechta Guruhda Ishlash

### Stsenariy 1: Foydalanuvchi 3 ta guruhda

```
Guruh 1: ✅ Chiqarildi
Guruh 2: ✅ Chiqarildi
Guruh 3: ❌ Bot admin emas (xatolik)

Natija: 2/3 muvaffaqiyatli
```

### Stsenariy 2: Foydalanuvchi faqat 1 ta guruhda

```
Guruh 1: ✅ Chiqarildi
Guruh 2: ⚠️ Guruhda emas (ignore)
Guruh 3: ⚠️ Guruhda emas (ignore)

Natija: 1/3 muvaffaqiyatli
```

### Stsenariy 3: Foydalanuvchi hech qaysi guruhda emas

```
Barcha guruhlar: ⚠️ Guruhda emas

Natija: 0/3 (Toast: "Foydalanuvchi guruhlarda topilmadi")
```

## API Tafsilotlari

### Request

```javascript
POST /removeUserFromTelegramGroups
Headers: {
  "Authorization": "Bearer <firebase-id-token>",
  "Content-Type": "application/json"
}
Body: {
  "telegramId": "123456789"
}
```

### Response (Success)

```javascript
{
  "ok": true,
  "total": 3,        // Jami guruhlar soni
  "removed": 2,      // Muvaffaqiyatli chiqarilgan
  "failed": 1,       // Xatolik bo'lgan
  "results": [...]   // Batafsil natijalar
}
```

### Response (Error)

```javascript
{
  "ok": false,
  "error": "telegram-user_id-missing",
  "details": "..."
}
```

## Xavfsizlik

### Authentication

- ✅ Firebase Auth ID token talab qilinadi
- ✅ Faqat admin va super_admin ruxsati bor
- ✅ Bot token backend'da saqlanadi (secret)

### Rate Limiting

- Firebase Functions default rate limit
- Har bir guruh uchun alohida so'rov
- Xatolik bo'lsa keyingi guruhga o'tadi

### Logging

Barcha harakatlar log qilinadi:

```javascript
logger.info("Removing user from all Telegram groups", { telegramId });
logger.info("User removal result", {
  telegramId,
  total,
  removed,
  failed,
});
```

## Frontend Integratsiya

### Import

```javascript
import { removeUserFromTelegramGroups } from "../utils/removeFromTelegramGroups";
```

### Ishlatish

```javascript
const candidateTelegramId = docCv?.telegramId;
if (candidateTelegramId) {
  try {
    const result = await removeUserFromTelegramGroups(candidateTelegramId);
    if (result.ok) {
      console.log(`Removed from ${result.removed} groups`);
    }
  } catch (error) {
    console.error("Failed to remove:", error);
  }
}
```

## Monitoring

### Console Logs

```javascript
// Success
"Telegram groups removal result: {
  ok: true,
  total: 3,
  removed: 2,
  failed: 1,
  results: [...]
}"

// Error
"Failed to remove from Telegram groups: Error: ..."
```

### Firebase Functions Logs

```bash
firebase functions:log --only removeUserFromTelegramGroups
```

### Firestore Audit

Guruhlar ro'yxati:

```bash
firebase firestore:get telegram_groups
```

## Kelajakda Yaxshilash

### 1. Webhook Integration

Hozir: Firestore'dan guruhlar ro'yxatini oladi
Kelajak: Real-time bot updates orqali guruhlarni kuzatish

### 2. Batch Processing

Hozir: Har bir guruh uchun alohida so'rov
Kelajak: Parallel processing (Promise.all)

### 3. Retry Logic

Hozir: Xatolik bo'lsa keyingi guruhga o'tadi
Kelajak: Avtomatik retry (3 marta)

### 4. Notification

Hozir: Toast notification
Kelajak: Email yoki Telegram notification adminga

## Muhim Eslatmalar

1. **Telegram ID majburiy** - Foydalanuvchida `telegramId` bo'lishi shart
2. **Bot admin bo'lishi kerak** - Har bir guruhda alohida
3. **Firestore guruhlar** - `active: true` bo'lgan guruhlar
4. **Xatoliklar ignore** - "USER_NOT_PARTICIPANT" normal holat
5. **Async jarayon** - Rad qilish jarayonini to'xtatmaydi

## Qo'llab-quvvatlash

Muammolar yuzaga kelsa:

1. Firebase Functions logs tekshiring
2. Browser console tekshiring
3. Telegram bot admin ruxsatlarini tasdiqlang
4. Firestore `telegram_groups` collection tekshiring
