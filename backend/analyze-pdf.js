const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function analyzePDF(pdfPath) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Analyzing: ${path.basename(pdfPath)}`);
  console.log(`${"=".repeat(60)}\n`);

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`Total fields found: ${fields.length}\n`);

  const textFields = [];
  const radioGroups = [];
  const checkboxes = [];
  const dropdowns = [];
  const otherFields = [];

  for (const field of fields) {
    const name = field.getName();
    const type = field.constructor.name;

    switch (type) {
      case "PDFTextField":
        const textField = form.getTextField(name);
        textFields.push({
          name,
          type: "text",
          currentValue: textField.getText() || "",
          isMultiline: textField.isMultiline(),
        });
        break;

      case "PDFRadioGroup":
        const radioGroup = form.getRadioGroup(name);
        const options = radioGroup.getOptions();
        radioGroups.push({
          name,
          type: "radio",
          options,
          selected: radioGroup.getSelected() || "none",
        });
        break;

      case "PDFCheckBox":
        const checkbox = form.getCheckBox(name);
        checkboxes.push({
          name,
          type: "checkbox",
          isChecked: checkbox.isChecked(),
        });
        break;

      case "PDFDropdown":
        const dropdown = form.getDropdown(name);
        dropdowns.push({
          name,
          type: "dropdown",
          options: dropdown.getOptions(),
          selected: dropdown.getSelected() || [],
        });
        break;

      default:
        otherFields.push({ name, type });
    }
  }

  // Print Text Fields
  if (textFields.length > 0) {
    console.log(`\n📝 TEXT FIELDS (${textFields.length}):`);
    console.log("-".repeat(40));
    textFields.forEach((f) => {
      console.log(`  Name: "${f.name}"`);
      console.log(`    Multiline: ${f.isMultiline}`);
      if (f.currentValue) console.log(`    Current: "${f.currentValue}"`);
      console.log("");
    });
  }

  // Print Radio Groups
  if (radioGroups.length > 0) {
    console.log(`\n🔘 RADIO GROUPS (${radioGroups.length}):`);
    console.log("-".repeat(40));
    radioGroups.forEach((f) => {
      console.log(`  Name: "${f.name}"`);
      console.log(`    Options: [${f.options.map((o) => `"${o}"`).join(", ")}]`);
      console.log(`    Selected: "${f.selected}"`);
      console.log("");
    });
  }

  // Print Checkboxes
  if (checkboxes.length > 0) {
    console.log(`\n☑️  CHECKBOXES (${checkboxes.length}):`);
    console.log("-".repeat(40));
    checkboxes.forEach((f) => {
      console.log(`  Name: "${f.name}" - Checked: ${f.isChecked}`);
    });
  }

  // Print Dropdowns
  if (dropdowns.length > 0) {
    console.log(`\n📋 DROPDOWNS (${dropdowns.length}):`);
    console.log("-".repeat(40));
    dropdowns.forEach((f) => {
      console.log(`  Name: "${f.name}"`);
      console.log(`    Options: [${f.options.map((o) => `"${o}"`).join(", ")}]`);
      console.log("");
    });
  }

  // Print Other Fields
  if (otherFields.length > 0) {
    console.log(`\n❓ OTHER FIELDS (${otherFields.length}):`);
    console.log("-".repeat(40));
    otherFields.forEach((f) => {
      console.log(`  Name: "${f.name}" - Type: ${f.type}`);
    });
  }

  // Generate JSON schema for frontend
  console.log(`\n\n📦 JSON SCHEMA FOR FRONTEND:`);
  console.log("-".repeat(40));
  const schema = {
    textFields: textFields.map((f) => ({ name: f.name, label: f.name, multiline: f.isMultiline })),
    radioGroups: radioGroups.map((f) => ({ name: f.name, label: f.name, options: f.options })),
    checkboxes: checkboxes.map((f) => ({ name: f.name, label: f.name })),
    dropdowns: dropdowns.map((f) => ({ name: f.name, label: f.name, options: f.options })),
  };
  console.log(JSON.stringify(schema, null, 2));

  return schema;
}

// Main execution
const pdfDir = path.join(__dirname, "pdf");
const targetPdf = process.argv[2];

if (targetPdf) {
  // Analyze specific PDF
  const pdfPath = path.join(pdfDir, targetPdf);
  if (fs.existsSync(pdfPath)) {
    analyzePDF(pdfPath).catch(console.error);
  } else {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }
} else {
  // List available PDFs
  console.log("Available PDF files in backend/pdf/:");
  const files = fs.readdirSync(pdfDir).filter((f) => f.endsWith(".pdf"));
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log("\nUsage: npm run analyze <filename.pdf>");
  console.log("Example: npm run analyze erklaerung-zum-beschaeftigungsverhaeltnis.pdf");
}
