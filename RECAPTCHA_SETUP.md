# reCAPTCHA Xatoligini Tuzatish

## Xato:

```
POST https://us-central1-consulting-bdb74.cloudfunctions.net/submitCandidate 403 (Forbidden)
Fehler beim Senden an Firestore: Error: recaptcha-failed
```

## Sabab:

Frontend'da ishlatilayotgan reCAPTCHA site key bilan backend'dagi secret key mos kelmayapti yoki backend'da secret key umuman sozlanmagan.

---

## YECHIM 1: To'g'ri reCAPTCHA Sozlash (Tavsiya etiladi)

### 1-qadam: Google reCAPTCHA key olish

1. [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) sahifasiga kiring
2. "Register a new site" tugmasini bosing
3. Quyidagi ma'lumotlarni kiriting:
   - **Label**: consulting-admin (istalgan nom)
   - **reCAPTCHA type**: reCAPTCHA v2 → "I'm not a robot Checkbox"
   - **Domains**:
     ```
     localhost
     127.0.0.1
     admin.consultinguz.de
     ```
4. "Submit" tugmasini bosing
5. **Site Key** va **Secret Key** ni nusxalab oling

### 2-qadam: Frontend sozlash

Loyihangiz root papkasida `.env` fayl yarating:

```env
# .env fayl
VITE_RECAPTCHA_SITE_KEY=sizning_site_key_bu_yerda
```

**Masalan:**

```env
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

### 3-qadam: Backend sozlash (Firebase Functions)

Terminal'da quyidagi buyruqlarni bajaring:

```bash
# 1. Firebase CLI ni o'rnating (agar o'rnatilmagan bo'lsa)
npm install -g firebase-tools

# 2. Firebase'ga login qiling
firebase login

# 3. Secret key ni o'rnating
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
```

Oxirgi buyruqdan keyin terminal sizdan secret key ni kiritishni so'raydi.
Google reCAPTCHA Console'dan olingan **Secret Key** ni kiriting va Enter bosing.

### 4-qadam: Functions ni qayta deploy qilish

```bash
firebase deploy --only functions:submitCandidate
```

### 5-qadam: Development serverni qayta ishga tushiring

```bash
npm run dev
```

---

## YECHIM 2: Vaqtincha Test Uchun reCAPTCHA ni O'chirish (Faqat development)

**OGOHLANTIRISH:** Bu yechim faqat test uchun! Production'da hech qachon ishlatmang!

### Variant A: Frontend'da captcha tekshiruvini o'chirish

`src/pages/Create.jsx` faylida 1933-1935 qatorlarni comment qiling:

```javascript
// if (!captchaToken) {
//   blockingErrors.push("captcha");
// }
```

### Variant B: Backend'da captcha tekshiruvini o'chirish

`functions/index.js` faylida 844-865 qatorlarni comment qiling:

```javascript
// Public endpoint protection: verify reCAPTCHA server-side.
// if (!recaptchaToken) {
//   return res.status(400).json({ ok: false, error: "missing-recaptchaToken" });
// }
// const secret = String(RECAPTCHA_SECRET_KEY.value() || "").trim();
// if (!secret) {
//   return res
//     .status(500)
//     .json({ ok: false, error: "recaptcha-not-configured" });
// }
// const verify = await verifyRecaptchaV2({
//   token: recaptchaToken,
//   remoteIp: getClientIp(req),
//   secret,
// });
// if (!verify.ok) {
//   return res.status(403).json({
//     ok: false,
//     error: "recaptcha-failed",
//     reason: verify.reason,
//   });
// }
```

Keyin functions ni qayta deploy qiling:

```bash
firebase deploy --only functions:submitCandidate
```

---

## Test Keys (Faqat Development)

Google reCAPTCHA test kalitlari mavjud (automatic ravishda muvaffaqiyatli bo'ladi):

**Site Key:**

```
6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

**Secret Key:**

```
6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

Bu kalitlar faqat `localhost` da ishlaydi va har doim muvaffaqiyatli verification beradi.

---

## Tekshirish

1. Development serverni ishga tushiring:

   ```bash
   npm run dev
   ```

2. Browser'da ochingva forma sahifasiga kiring

3. reCAPTCHA checkboxni bosing

4. Forma to'ldirib submit qiling

5. Agar muvaffaqiyatli bo'lsa, xato ketdi demakdir!

---

## Qo'shimcha Maslahatlar

1. **Browser console**ni tekshiring (`F12`) - qo'shimcha xatolar bormi?

2. **Firebase Functions logs**ni tekshiring:

   ```bash
   firebase functions:log --only submitCandidate
   ```

3. **CORS xatoligi** bo'lsa, `functions/index.js` dagi 42-57 qatorlardagi `allowedOrigins` ro'yxatiga sizning domeningizni qo'shing.

4. **.env faylni** git'ga commit qilmang! `.gitignore` da bo'lganini tekshiring.

---

## Yordam kerakmi?

Agar muammo hal bo'lmasa, quyidagi ma'lumotlarni yuboring:

1. Browser console'dagi to'liq xato xabari
2. Firebase Functions log'lari
3. Qaysi domendan (localhost/production) test qilayotganingiz
4. `.env` fayl mavjudmi va to'g'ri sozlanganmi (SITE_KEY ni ko'rsating, lekin SECRET_KEY ni hech qachon ulashmang!)

