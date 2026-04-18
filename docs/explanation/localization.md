# Localization

How the app handles languages — and why we don't use an i18n library.

---

## The two audiences

Consulting Admin has two user types with different language needs:

| User | Primary language | Where they interact |
|---|---|---|
| **Admin staff** | German | All admin surfaces (`/`, `/generate`, `/settings`, etc.) |
| **Candidates** | Uzbek (some German) | Public `/create` form, `/dataExchange/:id`, consent documents |

The admin UI is **German-only**. We deliberately chose not to internationalize it:

- Admin staff is a small, controlled population — all speak German.
- Translating UI strings adds maintenance overhead that returns nothing for this user base.
- No i18n library = simpler component tree, no `t()` wrapping every string.

The candidate-facing surfaces are **bilingual where it matters** — particularly in consent forms, where the candidate must understand what they're agreeing to.

---

## What's localized

### Bilingual documents (Uzbek + German in one PDF)

These are side-by-side bilingual because the candidate signs them:

- **Rozilik xati** — parental consent (for candidates whose family authority extends to the trip)
- **Nomzod rozilik xati** — candidate's own consent to broker & employer
- **Foto/Video Rozilik** — photo/video usage consent

Source: the React components at `src/pages/RozilikXati.jsx`, `src/pages/NomzodRozilikXati.jsx`, `src/pages/FotoVideoRozilik.jsx`.

### Uzbek regional data

- Uzbek region / city list for candidate address (`src/constants/regions.js`).
- Birth place picker uses the same data.

### German-only surfaces

- All admin UI labels, buttons, error messages.
- Email templates for status updates.
- Generated contracts (Beratungsvertrag, Vermittlungsvertrag, Vollmacht, …) — these are legally German documents.
- German postal code validation for address input.

---

## Time zones & date formatting

| Setting | Value |
|---|---|
| Display time zone | `Asia/Tashkent` (UTC+5) |
| Date format | `DD.MM.YYYY` (German convention) |
| Time format | `HH:mm` 24-hour |

Pragmatic reason: the admin team operates in Tashkent. Candidate-facing timestamps are also rendered in Tashkent time because that's where the candidate is. German employers see their own timestamps in their own tools.

The `Erstellt` column on the candidate table shows date only, no time — the full timestamp is overwhelming in a list view.

---

## Language-level labels (A1–C2)

Candidates record their German language level as one of `A1, A2, B1, B2, C1, C2`. The values are the literal CEFR keys (not localized strings), stored as-is in Firestore. Labels come from `src/constants/languageOptions.js`.

Why not localize? These are internationally-recognized language codes. Admins know what they mean; candidates are used to seeing them.

---

## Status stage labels

Stage labels in the table (`1-bosqich`, `2-bosqich`, …) are **Uzbek words** in a **German-language UI**. This is intentional: the internal team discusses stages in Uzbek, and the short "bosqich" (stage) labels are ingrained. The stage _keys_ in Firestore (`stage_1`, `stage_2`, …) are language-neutral.

If the labels ever need to be shown to a German-speaking stakeholder, they're not user-facing — they appear only on internal admin screens.

---

## Fonts

- **Inter** is the only UI font. It has excellent Latin-1 (German) coverage and readable Cyrillic (Russian transliteration support) + Uzbek-Latin glyphs.
- **Loaded weights:** 400, 600, 700 (regular + italic).
- **No font for Uzbek-Cyrillic** — the admin UI assumes Uzbek-Latin, which is standard for the modern admin population.

---

## What to do if localization needs grow

If the admin UI needs to become multilingual (e.g., English for an external stakeholder):

1. Install `react-i18next` or equivalent.
2. Extract strings into locale files (expect ~400–600 keys).
3. Wrap text in `t()` calls systematically.
4. Provide a language toggle in the navbar.

This is not a small task — budget 1–2 engineer-weeks for a first pass. Don't do it speculatively.
