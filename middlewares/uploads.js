const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define upload paths
const imageUploadPath = path.join(__dirname, "..", "uploads", "activities");
const pdfUploadPath = path.join(__dirname, "..", "uploads", "pdfs");

// Ensure both directories exist
[imageUploadPath, pdfUploadPath].forEach((folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, pdfUploadPath);
    } else {
      cb(null, imageUploadPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
