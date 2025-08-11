import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete an image from Cloudinary by publicId
 * @param {string} publicId
 * @returns {Promise<void>}
 */
export async function deleteFileFromCloudinary(publicId) {
  if (!publicId) throw new Error('Missing publicId for Cloudinary deletion');
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== 'ok') {
    throw new Error('Failed to delete image from Cloudinary');
  }
}
