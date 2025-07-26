const supabase = require("./supabase");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mime = require("mime-types");

async function uploadPdf(fileBuffer, originalName, bucketName) {
  const fileExt = path.extname(originalName).toLowerCase();
  const fileName = `${uuidv4()}${fileExt}`; // اسم آمن 100%
  const contentType = mime.lookup(fileExt);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: contentType || "application/pdf",
      upsert: false,
    });

  if (error) throw error;

  const publicUrl = supabase.storage.from(bucketName).getPublicUrl(fileName)
    .data.publicUrl;

  return { path: data.path, publicUrl };
}

module.exports = uploadPdf;
