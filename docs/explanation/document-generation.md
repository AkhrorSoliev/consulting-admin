# Document generation

Why the project has a small library of PDF templates, how they're produced, and how they get into the candidate's hands (and back again, signed).

For the list of templates and their routes see [../reference/routes.md](../reference/routes.md). For how to add a new one see [../how-to/add-document-template.md](../how-to/add-document-template.md).

---

## Why so many documents?

Placing a candidate from Uzbekistan into a German job requires a pile of paperwork — some for the German labor agency (Bundesagentur für Arbeit), some for immigration (§81a AufenthG accelerated skilled worker procedure), some bilateral consents, some employer-side attestations. Nobody ships this flow without automating the forms.

There are three kinds:

1. **Consulting-side contracts** the agency needs signed (Beratungsvertrag, Vermittlungsvertrag, Vollmacht).
2. **Consent documents** the candidate signs so their data/photo/video can be used.
3. **Government fillable forms** the employer files with the labor agency (Erklärung Beschäftigung, Zusatzblatt A/B/C/D, Beschäftigungsverhältnis).

---

## Two generation pipelines

The project deliberately uses two different pipelines, because fillable government PDFs and custom-designed contracts have very different needs.

### Pipeline 1 — Client-side (`@react-pdf/renderer`)

**Used for:** Beratungsvertrag, Vermittlungsvertrag, Vollmacht, Vollmacht Arbeitgeber, Rozilik xati, Nomzod rozilik xati, Mitarbeiterwohnung, Sprachsbestätigung, Einwilligungserklärung, Foto/Video Rozilik, Personalfragebogen, and the candidate CV itself.

```
candidate data (Firestore)
  → React components in src/pages/<Doc>.jsx
  → @react-pdf/renderer
  → Blob in browser
  → Storage upload
```

**Why client-side?** We designed these templates ourselves. They're composed of React components — same layout patterns we use everywhere else. Live preview is free: the admin edits the template body in `/settings/documents/<docId>` and sees the PDF update in the side pane immediately. No server round-trip.

### Pipeline 2 — Express backend (`backend/`, `pdf-lib`)

**Used for:** Erklärung Beschäftigung, Zusatzblatt A/B/C/D, Beschäftigungsverhältnis.

```
candidate data (client)
  → POST /generate-pdf { templateName, fields }
  → backend loads backend/pdf/<templateName>.pdf
  → pdf-lib fills form fields by name
  → response: filled PDF
  → Storage upload
```

**Why a backend?** These are official, visually-locked government PDFs. We can't re-lay them out — the labor agency expects the exact form. `pdf-lib` inspects the PDF's form-field structure and fills values in place. Doing this reliably in a browser or in a Functions cold-start is flaky, so a small always-warm Express service exists just for this job.

`backend/analyze-pdf.js` is a dev tool that dumps field names for a new template — useful when adding one.

---

## The template editor

`/settings/documents/` is a dashboard of templates. Each template has its own editor at `/settings/documents/<docId>` (e.g., `/settings/documents/beratungsvertrag`).

The editor is a split pane:

- **Left:** form fields pulled from the template's schema (consultant name, address, clauses, signature lines, …).
- **Right:** live PDF preview rendered by `@react-pdf/renderer`.

The admin edits the template _body_ — the boilerplate that appears for every candidate. Candidate-specific data (name, passport, address) is injected at generation time, not stored with the template.

Template data lives in Firestore at `documents/<docId>`. Defaults for fillable PDFs live in `settings/fillable_pdf_defaults`.

---

## Generating for a specific candidate

In `/generate/:major/:id`, the **Documents** section lists the generable templates. Clicking one opens a modal with the final PDF. From there the admin can:

- Download the PDF locally.
- Upload a copy to `Storage: outgoing/{candidateId}/{docId}.pdf`.
- Record a reference in the candidate's `outgoingDocuments[]` array, with timestamp and `sentBy` user ID.
- Optionally email the candidate a data-exchange link so they can download and sign.

Candidates who log into `/dataExchange/{candidateId}` see the list of outgoing documents ready for download.

---

## The signed-copy round-trip

After the candidate signs a document (on paper, scanned, or digitally):

1. Candidate uploads the scan at `/dataExchange/{candidateId}`.
2. File lands at `Storage: incoming/{candidateId}/{filename}.pdf`.
3. A reference is written to the candidate's `incomingDocuments[]` array. This write is **publicly permitted** — the Firestore rules have an explicit exception for it — because the candidate isn't authenticated with Firebase Auth.
4. Admin sees the signed scan in the candidate profile and can approve/reject.

The public-write exception is scoped narrowly to `incomingDocuments` and the `incoming/` storage path. No other public writes are possible. The tradeoff is discussed in [security-model.md](security-model.md).

---

## Why PDFs are stored, not re-generated

You might wonder why we upload generated PDFs to Storage instead of re-generating them on demand. Three reasons:

1. **Audit trail.** Once a document has been sent to a candidate, it must not change. The employer and the German authorities see a specific PDF with a specific hash.
2. **Template editing.** Admins can edit templates (e.g., updating a clause). If we re-generated from the current template each time, historical sends would retroactively change — unacceptable.
3. **Cost/speed.** Re-rendering even simple templates takes meaningful compute; a file fetch is always faster.

`outgoing/` acts as a content-addressed archive.

---

## What to read next

- [../how-to/add-document-template.md](../how-to/add-document-template.md) — step-by-step to wire a new template into the UI and storage.
- [candidate-lifecycle.md](candidate-lifecycle.md) — when each document is produced in the placement flow.
- [../reference/storage-paths.md](../reference/storage-paths.md) — canonical layout of the Storage bucket.
