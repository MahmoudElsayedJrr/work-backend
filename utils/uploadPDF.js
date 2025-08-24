const path = require("path");
const fs = require("fs");

async function savePdfLocally(file, folder) {
  const storedFileName = file.filename || path.basename(file.path);
  const publicUrl = `/uploads/${folder}/${storedFileName}`;
  const originalName = Buffer.from(file.originalname, "latin1").toString(
    "utf8"
  );
  return { fileName: storedFileName, publicUrl, originalName };
}

module.exports = savePdfLocally;
