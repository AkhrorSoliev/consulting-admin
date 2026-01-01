# Migration Guide: Remove Duplicate Document Fields

## Muammo

Bazada hujjatlar 3 ta turli maydonlarda takrorlanib saqlanmoqda:

- `attachments` obyekti
- `dokumente` obyekti
- `languageCertificatesDetailed` (root darajasida)

Bu ortiqcha joy egallaydi va ma'lumotlar inconsistent bo'lishiga olib keladi.

## Yechim

Migration script barcha mavjud kandidatlarni yangilab, faqat `documents` maydonini qoldiradi.

## Ishlatish

### 1. Avval dry-run rejimida test qiling

```bash
cd consulting-admin
node functions/scripts/migrate-remove-duplicate-documents.cjs --dry-run
```

Bu hech qanday o'zgarish qilmaydi, faqat nima o'zgarishini ko'rsatadi.

### 2. Bitta kolleksiyani test qiling

```bash
node functions/scripts/migrate-remove-duplicate-documents.cjs --dry-run --collection=pflegefachkraft
```

### 3. Haqiqiy migration

**⚠️ DIQQAT: Avval backup oling!**

```bash
# Barcha kolleksiyalarni yangilash
node functions/scripts/migrate-remove-duplicate-documents.cjs

# Faqat bitta kolleksiya
node functions/scripts/migrate-remove-duplicate-documents.cjs --collection=pflegefachkraft
```

### 4. Batch size o'zgartirish

```bash
# Kichikroq batch (sekinroq, lekin xavfsizroq)
node functions/scripts/migrate-remove-duplicate-documents.cjs --batch-size=10

# Kattaroq batch (tezroq)
node functions/scripts/migrate-remove-duplicate-documents.cjs --batch-size=100
```

## Script nima qiladi?

### Olib tashlanadi:

- ❌ `attachments` obyekti
- ❌ `dokumente` obyekti
- ❌ `languageCertificatesDetailed` (root level)

### Saqlanadi va konsolidatsiya qilinadi:

- ✅ `documents.diplomas` - barcha diploma fayllari
- ✅ `documents.certificates` - barcha til sertifikatlari
- ✅ `documents.certificatesDetailed` - sertifikat detallari (type bilan)
- ✅ `documents.passport` - passport fayllari
- ✅ `documents.noLanguageCertificate` - flag

## Konsolidatsiya mantigi

Script quyidagi tartibda ma'lumotlarni birlashtiradi (birinchi topilgan qiymat ishlatiladi):

```javascript
documents.diplomas =
  documents.diplomas || attachments.diplomas || dokumente.diplome;
documents.certificates =
  documents.certificates ||
  attachments.languageCertificates ||
  dokumente.zertifikate;
documents.certificatesDetailed =
  documents.certificatesDetailed ||
  attachments.languageCertificatesDetailed ||
  root.languageCertificatesDetailed;
documents.passport =
  documents.passport || attachments.passport || dokumente.reisepass;
```

## Xavfsizlik

1. **Dry-run rejimi** - avval test qilish uchun
2. **Batch processing** - katta bazalar uchun
3. **Error handling** - xatolik bo'lsa ham davom etadi
4. **Progress tracking** - jarayon ko'rinadi
5. **Skip logic** - duplicate bo'lmagan dokumentlarni o'tkazib yuboradi

## Natija

Migration muvaffaqiyatli bo'lgandan keyin:

```
📊 MIGRATION SUMMARY
============================================================
Total documents: 1250
Migrated: 1180
Skipped (no duplicates): 70
Errors: 0
Duration: 45.32s
============================================================
```

## Rollback

Agar muammo bo'lsa, Firebase consoleda yoki backup dan qayta tiklash mumkin.

**Tavsiya:** Migration dan oldin Firestore export qiling:

```bash
gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
```

## Qo'shimcha

Agar yangi kolleksiya qo'shmoqchi bo'lsangiz, script ichidagi `CANDIDATE_COLLECTIONS` arrayiga qo'shing:

```javascript
const CANDIDATE_COLLECTIONS = [
  "pflegefachkraft",
  "krankenpfleger",
  // ... yangi kolleksiya nomi
];
```
