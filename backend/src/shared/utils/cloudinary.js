import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../../env.js";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key:    ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer or path to Cloudinary.
 * @param {string} filePath — local path to the file
 * @param {string} folder — Cloudinary folder name
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export const uploadToCloudinary = async (filePath, folder = "smartniyukti") => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
};

export default cloudinary;
