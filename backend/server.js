const express = require("express");
const cors = require("cors");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// PDF templates directory
const PDF_DIR = path.join(__dirname, "pdf");

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// List available PDF templates
app.get("/templates", (req, res) => {
  try {
    const files = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));
    res.json({ templates: files });
  } catch (error) {
    res.status(500).json({ error: "Failed to list templates" });
  }
});

// Analyze PDF fields (for development/debugging)
app.get("/analyze/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(PDF_DIR, filename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "PDF template not found" });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const result = {
      filename,
      totalFields: fields.length,
      textFields: [],
      radioGroups: [],
      checkboxes: [],
      dropdowns: [],
    };

    for (const field of fields) {
      const name = field.getName();
      const type = field.constructor.name;

      switch (type) {
        case "PDFTextField":
          const textField = form.getTextField(name);
          result.textFields.push({
            name,
            multiline: textField.isMultiline(),
          });
          break;

        case "PDFRadioGroup":
          const radioGroup = form.getRadioGroup(name);
          result.radioGroups.push({
            name,
            options: radioGroup.getOptions(),
          });
          break;

        case "PDFCheckBox":
          result.checkboxes.push({ name });
          break;

        case "PDFDropdown":
          const dropdown = form.getDropdown(name);
          result.dropdowns.push({
            name,
            options: dropdown.getOptions(),
          });
          break;
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate filled PDF
app.post("/generate-pdf", async (req, res) => {
  try {
    const { template, data } = req.body;

    if (!template) {
      return res.status(400).json({ error: "Template filename is required" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Data object is required" });
    }

    const pdfPath = path.join(PDF_DIR, template);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "PDF template not found" });
    }

    // Load the PDF template
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Debug: log incoming data
    console.log("\n=== Incoming text fields ===");
    console.log(JSON.stringify(data.textFields, null, 2));

    // Fill text fields
    if (data.textFields && typeof data.textFields === "object") {
      for (const [fieldName, value] of Object.entries(data.textFields)) {
        try {
          const field = form.getTextField(fieldName);
          if (field && value !== undefined && value !== null) {
            field.setText(String(value));
          }
        } catch (e) {
          console.warn(`Text field "${fieldName}" not found or error:`, e.message);
        }
      }
    }

    // Select radio buttons
    if (data.radioGroups && typeof data.radioGroups === "object") {
      for (const [groupName, value] of Object.entries(data.radioGroups)) {
        try {
          const radioGroup = form.getRadioGroup(groupName);
          if (radioGroup && value) {
            radioGroup.select(value);
          }
        } catch (e) {
          console.warn(`Radio group "${groupName}" not found or error:`, e.message);
        }
      }
    }

    // Check/uncheck checkboxes
    if (data.checkboxes && typeof data.checkboxes === "object") {
      for (const [checkboxName, isChecked] of Object.entries(data.checkboxes)) {
        try {
          const checkbox = form.getCheckBox(checkboxName);
          if (checkbox) {
            if (isChecked) {
              checkbox.check();
            } else {
              checkbox.uncheck();
            }
          }
        } catch (e) {
          console.warn(`Checkbox "${checkboxName}" not found or error:`, e.message);
        }
      }
    }

    // Select dropdown values
    if (data.dropdowns && typeof data.dropdowns === "object") {
      for (const [dropdownName, value] of Object.entries(data.dropdowns)) {
        try {
          const dropdown = form.getDropdown(dropdownName);
          if (dropdown && value) {
            dropdown.select(value);
          }
        } catch (e) {
          console.warn(`Dropdown "${dropdownName}" not found or error:`, e.message);
        }
      }
    }

    // Flatten the form (makes it non-editable)
    form.flatten();

    // Save the PDF
    const filledPdfBytes = await pdfDoc.save();

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilename = `filled_${path.basename(template, ".pdf")}_${timestamp}.pdf`;

    // Send as downloadable PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${outputFilename}"`);
    res.setHeader("Content-Length", filledPdfBytes.length);
    res.send(Buffer.from(filledPdfBytes));
  } catch (error) {
    console.error("Generate PDF error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 PDF Backend Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health              - Health check`);
  console.log(`  GET  /templates           - List available PDF templates`);
  console.log(`  GET  /analyze/:filename   - Analyze PDF fields`);
  console.log(`  POST /generate-pdf        - Generate filled PDF\n`);
});
