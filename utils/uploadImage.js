const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

async function saveImageLocally(file) {
  const publicUrl = `/uploads/activityimages/${path.basename(file.path)}`;
  const originalName = Buffer.from(file.originalname, "latin1").toString(
    "utf8"
  );
  return { fileName: path.basename(file.path), publicUrl, originalName };
}

module.exports = saveImageLocally;
