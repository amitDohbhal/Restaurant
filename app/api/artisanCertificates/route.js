import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
let ArtisanCertificate 
try {
  ArtisanCertificate = mongoose.model('ArtisanCertificate');
} catch {
  ArtisanCertificate = require('@/models/ArtisanCertificate');
}
import mongoose from 'mongoose';
let Artisan;
try {
  Artisan = mongoose.model('Artisan');
} catch {
  Artisan = require('@/models/Artisan').default;
}
// GET all certificates or by artisan
export async function GET(req) {
  await connectDB();
  const url = new URL(req.url);
  const artisanId = url.searchParams.get('artisanId');
  try {
    let certificates;
    if (artisanId) {
      // First check if the artisan exists and get their certificates
      const artisan = await Artisan.findById(artisanId)
        .populate({
          path: 'certificates',
          populate: { path: 'artisan', select: 'firstName lastName' }
        })
        .select('certificates');
      
      if (artisan && artisan.certificates) {
        certificates = artisan.certificates;
      } else {
        certificates = [];
      }
    } else {
      certificates = await ArtisanCertificate.find()
        .populate('artisan', 'firstName lastName');
    }
    return NextResponse.json({ success: true, certificates });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch certificates', error: err.message }, { status: 500 });
  }
}

// CREATE a new certificate
export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const certificate = await ArtisanCertificate.create(body);
    // Push certificate _id to artisan's certificates array
    if (certificate.artisan) {
      await Artisan.findByIdAndUpdate(
        certificate.artisan,
        { $push: { certificates: certificate._id } },
        { new: true }
      );
    }
    return NextResponse.json({ success: true, certificate });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to create certificate', error: err.message }, { status: 500 });
  }
}

// UPDATE a certificate
export async function PUT(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await ArtisanCertificate.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
    return NextResponse.json({ success: true, certificate: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update certificate', error: err.message }, { status: 500 });
  }
}

// DELETE a certificate
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
  await connectDB();
  try {
    const { id } = await req.json();
    const certificate = await ArtisanCertificate.findById(id);
    if (!certificate) return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
    // Delete certificate image from Cloudinary if present
    if (certificate.image && typeof certificate.image === 'object' && certificate.image.key) {
      try {
        await deleteFileFromCloudinary(certificate.image.key);
      } catch (err) {
        console.error('Failed to delete certificate image from Cloudinary:', err.message);
      }
    }
    await ArtisanCertificate.findByIdAndDelete(id);
    // Remove certificate _id from artisan's certificates array
    if (certificate.artisan) {
      await Artisan.findByIdAndUpdate(
        certificate.artisan,
        { $pull: { certificates: certificate._id } },
        { new: true }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to delete certificate', error: err.message }, { status: 500 });
  }
}
