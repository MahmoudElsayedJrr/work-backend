const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define upload paths
const imageUploadPath = path.join(__dirname, "..", "uploads", "activities");
const pdfUploadPath = path.join(__dirname, "..", "uploads", "pdfs");
const contractualDocumentsUploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "contractualDocuments"
);

// Ensure both directories exist
[imageUploadPath, pdfUploadPath, contractualDocumentsUploadPath].forEach(
  (folderPath) => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "images") {
      cb(null, imageUploadPath);
    } else if (file.fieldname === "activityPdf") {
      cb(null, pdfUploadPath);
    } else if (file.fieldname === "contractualDocuments") {
      cb(null, contractualDocumentsUploadPath);
    } else {
      cb(new Error("Unknown field name"), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
