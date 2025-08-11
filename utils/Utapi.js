'use server'
import { v2 as cloudinary } from 'cloudinary';
// Only Cloudinary is supported for image deletion. All UploadThing logic has been removed.

export async function deleteFileFromCloudinary(publicId) {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    if (response.result !== 'ok') {
      throw new Error('Failed to delete file from Cloudinary');
    }
    return true;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
}
