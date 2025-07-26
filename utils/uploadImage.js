const supabase = require("./supabase");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mime = require("mime-types");

async function uploadImage(fileBuffer, originalName) {
  const fileExt = path.extname(originalName).toLowerCase();
  const fileName = `${uuidv4()}${fileExt}`;
  const bucketName = "activityimages";
  const contentType = mime.lookup(fileExt);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: contentType || "application/octet-stream",
      upsert: false,
    });

  if (error) throw error;

  const publicUrl = supabase.storage.from(bucketName).getPublicUrl(fileName)
    .data.publicUrl;

  console.log("Public URL:", publicUrl);

  return { path: data.path, publicUrl };
}

module.exports = uploadImage;
