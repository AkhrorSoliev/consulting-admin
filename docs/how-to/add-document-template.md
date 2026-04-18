# How to add a new document template

Walk through adding a new PDF template to the app — either client-side rendered (preferred) or backed by a fillable government PDF.

**You need this when:** a new contract, consent form, or government form enters the process.

**Audience:** frontend engineer with some Firebase familiarity. Expect to touch React components, Firestore, and (optionally) the PDF backend.

---

## Decide the pipeline

Read [../explanation/document-generation.md](../explanation/document-generation.md) first. The choice is:

1. **Client-side (`@react-pdf/renderer`)** — you design the layout from scratch in React. Use this for contracts, consents, invitations, anything we author ourselves.
2. **PDF backend (`backend/`, `pdf-lib`)** — you have a government-issued PDF with existing form fields and must not change its layout.

The rest of this guide is split by pipeline.

---

## Pipeline A: Client-side template (react-pdf)

### Step 1 — Add template metadata

Edit `src/constants/documentTemplates.js` (or equivalent) and register the template:

```javascript
{
  id: 'neue-einwilligung',
  title: 'Neue Einwilligung',
  description: 'Short description shown in /settings/documents',
  pipeline: 'client',
  component: 'NeueEinwilligung',
  // stage association, field schema, etc.
}
```

### Step 2 — Create the page component

Under `src/pages/`, create `NeueEinwilligung.jsx`. Follow the structure of an existing template like `Einwilligungserklaerung.jsx`:

```jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useCandidateData } from '…';

const styles = StyleSheet.create({ /* … */ });

export default function NeueEinwilligung({ candidate, config }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.heading}>Einwilligung</Text>
          {/* fields derived from candidate */}
          <Text>{candidate.firstName} {candidate.lastName}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

Keep the file under 200 lines. If it gets bigger, split into sub-components.

### Step 3 — Register the route in the settings editor

In `src/App.jsx` or `src/app/routeConfig.jsx`, add:

```jsx
<Route path="/settings/documents/neue-einwilligung" element={<NeueEinwilligungEditor />} />
```

The editor is typically a thin wrapper around `DocumentTemplateEditor` + the template component. Copy an existing editor like the one for `EinwilligungserklaerungEditor`.

### Step 4 — Seed Firestore defaults

Create `documents/neue-einwilligung` in Firestore with the template body and default field values. See the existing docs in the `documents/` collection for the shape.

The admin editor reads this doc to populate the form pane.

### Step 5 — Expose in /generate

In the Documents section of `/generate/:major/:id` (`src/pages/generate/sections/Documents...`), add a button that generates this new template. Wire it to upload the generated blob to `outgoing/<candidateId>/neue-einwilligung.pdf`.

### Step 6 — Update docs

Add the new template to:

- [../reference/routes.md](../reference/routes.md) (the document-editor table)
- [../explanation/document-generation.md](../explanation/document-generation.md) (template list)

---

## Pipeline B: Fillable government PDF

### Step 1 — Place the PDF

Drop the PDF into `backend/pdf/`. Give it a safe filename: lowercase, hyphenated, ends in `.pdf`. Example: `backend/pdf/neues-formular.pdf`.

### Step 2 — Analyze field names

Run the dev tool:

```bash
cd backend
node analyze-pdf.js neues-formular.pdf
```

This prints every form field in the PDF with its name and type (`Text`, `Checkbox`, etc.). Copy this list — you'll need it for mapping.

### Step 3 — Add template metadata

In `src/constants/documentTemplates.js`:

```javascript
{
  id: 'neues-formular',
  title: 'Neues Formular',
  pipeline: 'backend',
  filename: 'neues-formular.pdf',
  fields: {
    'name_field': { from: 'candidate.lastName' },
    'vorname_field': { from: 'candidate.firstName' },
    'geburtsdatum_field': { from: 'candidate.birthDate', format: 'DE_DATE' },
    // … one entry per form field
  },
}
```

The `from` paths are dot-paths into the candidate object. The `format` hints tell the frontend how to serialize the value before sending.

### Step 4 — Add a defaults doc (optional)

If the template has fields that are the same for every candidate (employer name, address, etc.), add them to `settings/fillable_pdf_defaults`:

```json
{
  "neues-formular": {
    "arbeitgeber_name": "Consulting GmbH",
    "arbeitgeber_plz": "12345",
    …
  }
}
```

The admin edits these via **Settings → Fillable PDF Defaults**.

### Step 5 — Wire into /generate

Add a button in the Documents section that:

1. Collects candidate fields per the `fields` mapping.
2. Merges with the defaults.
3. POSTs to the PDF backend:
   ```javascript
   fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
     method: 'POST',
     body: JSON.stringify({
       templateName: 'neues-formular.pdf',
       fields: mergedFields,
     }),
   })
   ```
4. Uploads the resulting PDF to `outgoing/<candidateId>/`.

### Step 6 — Redeploy the PDF backend

```bash
cd backend
# deploy per your setup (Cloud Run, VM, etc.)
```

The backend reads PDFs from the filesystem, so a redeploy is required whenever `backend/pdf/` changes.

### Step 7 — Update docs

Same as Pipeline A step 6, plus mention the new backend template in the table at [../reference/routes.md](../reference/routes.md).

---

## Testing checklist

Regardless of pipeline:

- [ ] Template renders in the settings editor's preview.
- [ ] All candidate-specific fields fill correctly (test with a candidate whose data is known).
- [ ] Generated PDF uploads to `outgoing/<candidateId>/` in Storage.
- [ ] Candidate sees the document in `/dataExchange/<candidateId>` download list.
- [ ] Download proxy produces a downloadable file (not inline).
- [ ] File size is under Storage rules (5 MB for outgoing).

---

## Common pitfalls

- **PDF fields with spaces in names** (Pipeline B). `pdf-lib` can read them, but escape them carefully in `fields` keys.
- **Non-ASCII in generated filenames.** The download proxy may set wrong headers. Stick to ASCII.
- **File too large** — optimize images before embedding. The 5 MB limit isn't generous if you're embedding scans.
- **Client-side PDF generation slowness** — if a template with lots of content takes >3s to render, split Pages or switch to the backend pipeline.

---

## See also

- [../explanation/document-generation.md](../explanation/document-generation.md) — why two pipelines
- [../reference/routes.md](../reference/routes.md) — the document-editor route table
- [../reference/storage-paths.md](../reference/storage-paths.md) — where generated files land
