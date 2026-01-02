# Migration Scripts

## Create Candidate Metadata

This script creates `candidate_metadata` entries for all existing candidates to enable the DataExchange feature.

### Prerequisites

1. Download your Firebase service account key:

   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in the project root

2. Install dependencies (if not already installed):
   ```bash
   npm install firebase-admin
   ```

### Usage

```bash
node scripts/create-candidate-metadata.js
```

### What it does

- Scans all candidate collections
- Creates metadata entries for candidates that don't have them
- Skips candidates that already have metadata
- Shows progress and statistics

### Collections processed

- krankenpfleger
- altenpfleger
- pflegefachkraft
- kinderkrankenpfleger
- uy-quruvchisi-fachkraft-2026

### Safety

- ✅ Read-only on candidate collections
- ✅ Only creates new metadata (doesn't modify existing)
- ✅ Can be run multiple times safely
- ✅ Shows detailed progress and errors

### After running

All existing candidates will have metadata entries, making the DataExchange page faster (no fallback search needed).
