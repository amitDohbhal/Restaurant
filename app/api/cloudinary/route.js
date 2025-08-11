import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    // Expecting multipart/form-data with a file
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
    return NextResponse.json({ url: result.secure_url, key: result.public_id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an image from Cloudinary by publicId
export async function DELETE(req) {
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 });
    }
    const result = await cloudinary.uploader.destroy(publicId);
    // console.log('Cloudinary destroy called for publicId:', publicId, 'result:', result);
    if (result.result !== 'ok') {
      return NextResponse.json({ error: 'Failed to delete image from Cloudinary', cloudinaryResult: result }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
