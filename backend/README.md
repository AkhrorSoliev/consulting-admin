# PDF Backend Server

Local Node.js backend for filling PDF forms using `pdf-lib`.

## Setup

```bash
cd backend
npm install
```

## Running

```bash
# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Analyze PDF fields
npm run analyze <filename.pdf>
```

## API Endpoints

### Health Check
```
GET /health
```

### List Templates
```
GET /templates
```
Returns list of available PDF templates in `backend/pdf/` directory.

### Analyze PDF Fields
```
GET /analyze/:filename
```
Returns all fillable fields (text, radio, checkbox, dropdown) in the PDF.

**Example:**
```bash
curl http://localhost:3001/analyze/erklaerung-zum-beschaeftigungsverhaeltnis.pdf
```

### Generate Filled PDF
```
POST /generate-pdf
Content-Type: application/json
```

**Request Body:**
```json
{
  "template": "erklaerung-zum-beschaeftigungsverhaeltnis.pdf",
  "data": {
    "textFields": {
      "txtf_3_Familienname": "Mustermann",
      "txtf_5_Vorname": "Max"
    },
    "radioGroups": {
      "rbtn_6_Geschlecht": "maennlich",
      "rbtn_2_Anlass": "Ersterteilung"
    },
    "checkboxes": {
      "chbx_46_Arbeitsentgelt": true
    }
  }
}
```

**Response:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="filled_....pdf"`

## PDF Field Naming Convention

Fields in the PDF follow this naming pattern:
- **Text fields:** `txtf_<number>_<name>`
- **Radio groups:** `rbtn_<number>_<name>`
- **Checkboxes:** `chbx_<name>`

## Available PDFs

| File | Description |
|------|-------------|
| `erklaerung-zum-beschaeftigungsverhaeltnis.pdf` | Main employment declaration form |
| `zusatzblatt_a_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf` | Supplement A |
| `zusatzblatt_b_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf` | Supplement B |
| `zusatzblatt_c_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf` | Supplement C |
| `zusatzblatt_d_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf` | Supplement D |

## Frontend Integration

Set the backend URL in your frontend `.env`:
```
VITE_PDF_BACKEND_URL=http://localhost:3001
```

For production (Railway), update this to your deployed URL.

## Deployment to Railway

1. Push the `backend/` folder to a separate repo or use monorepo setup
2. Set environment variables:
   - `PORT` (Railway sets this automatically)
3. Deploy

## Notes

- PDFs are flattened after filling (non-editable)
- All fields are optional - only provided fields are filled
- Radio group values must match exactly as defined in the PDF
