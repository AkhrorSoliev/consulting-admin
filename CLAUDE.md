# Consulting Admin - CLAUDE.md

## Loyiha haqida

React + Vite + DaisyUI (Tailwind CSS) asosidagi admin dashboard. Firebase (Firestore) backend. Kandidatlarni boshqarish, hujjat generatsiya qilish, statistika ko'rish uchun tizim.

## Texnologiyalar

- **Frontend:** React 18, React Router v7, Redux
- **Styling:** Tailwind CSS v4 + DaisyUI (themes: `winter` light, `dracula` dark)
- **Backend:** Firebase Firestore, Firebase Auth, Firebase Cloud Functions
- **Build:** Vite
- **Font:** Inter

## Sahifalar tuzilishi

```
/ (MainLayout)
├── index          → Home (Majorlar ro'yxati table ko'rinishida)
├── statistics     → Statistika sahifasi (grafik va raqamlar)
├── profile        → Profil
├── settings/      → Sozlamalar (admin only)
├── collectionCv/:major → Kandidatlar ro'yxati (table, 10 ta/sahifa)
├── generate/:major/:id → Kandidat hujjatlari
└── candidates/    → Kandidatlar boshqaruvi (admin only)
```

## Layout tuzilishi

- **Navbar** — yuqori qism, barcha sahifalarda ko'rinadi. Home, Statistiken, Profil, Einstellungen, Kandidaten linklari.
- **Sidebar** — chap tomondan slide-in toggle panel. Faqat Home sahifasidan boshqa sahifalarda ko'rinadi. Majorlar ro'yxati (action tugmalari bilan).
- **Home sahifasi** — Majorlar jadval (table) ko'rinishida. Sidebar va toggle button yo'q.

## Dizayn qoidalari

- DaisyUI semantic ranglari ishlatiladi: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `neutral`
- Inline rang (`#a855f7`, `#0088cc`, `text-green-600` kabi) **ishlatilmasin** — DaisyUI semantic ranglariga almashtiring
- Table header: `bg-neutral text-neutral-content`
- Table border: `rounded-xl border border-base-300 shadow-sm`
- Avatar placeholder: `bg-neutral text-neutral-content`
- Row hover: `hover:bg-primary/5`
- Barcha ikonlar tooltip (`title` attr) bilan ta'minlanishi kerak

## Kod qoidalari

- Har bir fayl **maksimum 200 qator** bo'lishi kerak
- Mobil responsive talab qilinmaydi (faqat desktop)
- CollectionCv jadvalda **10 ta** kandidat ko'rsatiladi (pagination bilan)
- Status ustunida qisqa format: `1-bosqich`, `2-bosqich`, `3-bosqich`, `4-bosqich`
- Erstellt ustunida faqat sana (soatsiz): `DD.MM.YYYY`
- Email yuborilmagan bo'lsa `—` ko'rsatiladi
- Lead va Telegram table da ko'rsatilmaydi

## Muhim fayllar

- `src/layouts/MainLayout.jsx` — asosiy layout (Navbar + Sidebar + Outlet)
- `src/components/Sidebar.jsx` — slide-in majorlar paneli
- `src/components/Navbar.jsx` — yuqori navigatsiya
- `src/pages/Home.jsx` — bosh sahifa (majorlar table)
- `src/pages/Statistics.jsx` — statistika sahifasi
- `src/pages/CollectionCv.jsx` — kandidatlar table
- `src/pages/collectionCv/CollectionStatistics.jsx` — badge statistika
- `src/pages/collectionCv/hooks/useCollectionFilters.js` — filter + pagination (10/sahifa)
- `src/app/routeConfig.jsx` — routing konfiguratsiyasi
- `src/constants/candidateStatus.js` — status bosqichlari
- `src/index.css` — DaisyUI themes, font, global styles
