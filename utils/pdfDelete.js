import { v2 as cloudinary } from 'cloudinary';

export async function deletePdfFromCloudinary(publicId) {
  if (!publicId) throw new Error('Missing publicId for Cloudinary deletion');
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'upload',
  });
  // console.log('Cloudinary PDF delete result:', result);
  if (result.result !== 'ok') {
    throw new Error('Failed to delete PDF from Cloudinary');
  }
}