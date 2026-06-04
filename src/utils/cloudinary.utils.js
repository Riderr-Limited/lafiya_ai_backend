const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadFile = async (filePath, folder = "healthcommunity") => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  // Delete local temp file
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { url: result.secure_url, publicId: result.public_id };
};

const uploadBuffer = async (buffer, folder = "healthcommunity", mimeType = "image/jpeg") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

const deleteFile = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadFile, uploadBuffer, deleteFile };