# Generate.jsx Refactoring

Bu papka Generate.jsx faylini bo'laklarga bo'lish natijasida yaratilgan.

## Struktura

```
generate/
├── README.md                    # Bu fayl
├── utils/                       # Utility funksiyalar
│   ├── index.js                # Barcha utils export
│   ├── imageProcessing.js      # Image va PDF processing
│   ├── proxyUtils.js           # URL proxy utilities
│   ├── fetchImageUtils.js      # Image fetch utilities
│   ├── dateUtils.js            # Date formatting
│   ├── addressUtils.js         # German address parsing
│   ├── stageUtils.js           # Stage va telegram utilities
│   └── generalUtils.js         # Umumiy utilities (safeJson, safeClone)
├── hooks/                       # Custom React hooks
│   ├── index.js                # Barcha hooks export
│   ├── usePdfGeneration.jsx    # PDF generation logic (JSX required)
│   ├── useDocumentManagement.js # Document CRUD operations
│   ├── useFormNormalization.js # Form data normalization
│   ├── useAddressManagement.js # Address field management
│   ├── useGenerateState.js     # Barcha state management (50+ useState)
│   ├── useOutgoingDocuments.js # Outgoing documents management
│   ├── useFormHandlers.js      # Form change handlers
│   ├── useDocumentOperations.js # Document upload/delete operations
│   ├── useUnsavedChanges.js    # Unsaved changes tracking
│   └── useSaveOperations.js    # Save operations
├── constants/                   # Constants va defaults
│   └── formDefaults.js         # Form initial values va options
├── components/                  # Generate page components
│   ├── modals/                 # Modal components
│   └── LivePreview.jsx         # CV preview component
└── pdf/                        # PDF document components
    └── CvPdfDocument.jsx       # CV PDF template

```

## Qanday ishlatish

### Utility funksiyalar

```javascript
import {
  todayDdMmYyyy,
  parseGermanAddress,
  fetchUrlAsImageDataUrlBestEffort,
  safeClone,
} from "./generate/utils";
```

### Custom Hooks

```javascript
import {
  useGenerateState,
  usePdfGeneration,
  useDocumentManagement,
  useFormHandlers,
  useDocumentOperations,
  useUnsavedChanges,
  useSaveOperations,
} from "./generate/hooks";

// Component ichida
const state = useGenerateState(INITIAL_FORM);
const { generateAndUploadBeratungsvertrag } = usePdfGeneration(
  formCv,
  addressFields
);
const { outgoingDocs, persistOutgoingDocs } = useDocumentManagement(
  collection,
  id,
  remoteMode,
  docCv
);
const handlers = useFormHandlers(
  formCv,
  setFormCv,
  setRecentlyAdded,
  isLimitedAdmin
);
const docOps = useDocumentOperations(
  formCv,
  setFormCv,
  documentsMarkedForDeletion,
  setDocumentsMarkedForDeletion,
  isLimitedAdmin
);
const { hasUnsavedChanges } = useUnsavedChanges(
  normalizedCurrentForm,
  normalizedDocForm,
  documentsMarkedForDeletion,
  isSaving
);
const { handleSave } = useSaveOperations(
  collection,
  id,
  remoteMode,
  user,
  docOps.performActualDeletions
);
```

### Constants

```javascript
import {
  DRIVING_LICENSE_OPTIONS,
  INITIAL_FORM,
} from "./generate/constants/formDefaults";
```

## Refactoring Natijalari

### Oldingi holat:

- **Generate.jsx**: 6,307 qator (251KB)
- Barcha logic bir faylda
- 50+ useState bir componentda
- Test qilish qiyin
- Code reuse yo'q

### Hozirgi holat:

- **Generate.jsx**: 5,756 qator (refactored, -551 qator)
- **Utils**: 7 ta alohida fayl (~600 qator)
- **Hooks**: 10 ta custom hook (~1,200 qator)
- **Constants**: 1 ta fayl (~50 qator)
- Har bir qism mustaqil test qilish mumkin
- Code reuse oson
- State management tashkil etilgan

### Keyingi Bosqich:

- Generate.jsx da yangi hooklarni ishlatish
- Yana ~1,500-2,000 qator kamayadi
- **Maqsad**: Generate.jsx ~3,000-3,500 qator

## Keyingi Qadamlar

1. ✅ Utility funksiyalarni ajratish (7 ta fayl)
2. ✅ Custom hooks yaratish (10 ta hook)
3. ✅ Constants ajratish (1 ta fayl)
4. ✅ Generate.jsx importlarni yangilash
5. ⏳ Generate.jsx da yangi hooklarni integratsiya qilish
6. ⏳ Form sections komponentlarga bo'lish (ixtiyoriy)
7. ⏳ Test qilish va debugging

## Eslatmalar

- Barcha utility funksiyalar original Generate.jsx dan ko'chirilgan
- Hech qanday logic o'zgartirilmagan, faqat tashkiliy refactoring
- Backward compatibility saqlanadi
