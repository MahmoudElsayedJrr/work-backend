const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define upload paths
const imageUploadPath = path.join(__dirname, "..", "uploads", "activityimages");
const activitypdfsUploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "activitypdfs"
);
const extractpdfsUploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "extractpdfs"
);
const contractualDocumentsUploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "contractualDocuments"
);

[
  imageUploadPath,
  activitypdfsUploadPath,
  contractualDocumentsUploadPath,
  extractpdfsUploadPath,
].forEach((folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "images") {
      cb(null, imageUploadPath);
    } else if (file.fieldname === "activitypdfs") {
      cb(null, activitypdfsUploadPath);
    } else if (file.fieldname === "extractpdfs") {
      cb(null, extractpdfsUploadPath);
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

/*   const multer = require("multer");

  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("نوع الملف غير مدعوم"));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  module.exports = upload; */
