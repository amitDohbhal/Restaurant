import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import mongoose from 'mongoose';
import ArtisanBanner from '@/models/ArtisanBanner';
import Artisan from '@/models/Artisan';

// GET banner by artisanId
export async function GET(req) {
    await connectDB();
    const url = new URL(req.url);
    const artisanId = url.searchParams.get('artisanId');
    if (!artisanId) {
        return NextResponse.json({ success: false, message: 'artisanId required' }, { status: 400 });
    }
    try {
        const banner = await ArtisanBanner.findOne({ artisan: artisanId }).populate('artisan');
        return NextResponse.json({ success: true, banner });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// CREATE a new banner
export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        // Enforce one banner per artisan
        const existing = await ArtisanBanner.findOne({ artisan: body.artisan });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Banner already exists for this artisan.' }, { status: 400 });
        }
        const banner = await ArtisanBanner.create(body);
        // Set artisan's artisanBanner reference (one-to-one)
        if (banner.artisan) {
            await Artisan.findByIdAndUpdate(
                banner.artisan,
                { artisanBanner: banner._id },
                { new: true }
            );
        }
        return NextResponse.json({ success: true, banner });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Failed to create banner', error: err.message }, { status: 500 });
    }
}

// UPDATE a certificate
export async function PUT(req) {
    await connectDB();
    try {
        const body = await req.json();
        const { _id, ...updateData } = body;
        const updated = await ArtisanBanner.findByIdAndUpdate(_id, updateData, { new: true });
        if (!updated) return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
        return NextResponse.json({ success: true, banner: updated });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Failed to update banner', error: err.message }, { status: 500 });
    }
}

// DELETE a certificate
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();
        const banner = await ArtisanBanner.findById(id);
        if (!banner) return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
        // Delete all images from Cloudinary if present
        if (Array.isArray(banner.images)) {
            for (const img of banner.images) {
                if (img && img.key) {
                    try {
                        await deleteFileFromCloudinary(img.key);
                    } catch (err) {
                        console.error('Failed to delete banner image from Cloudinary:', err.message);
                    }
                }
            }
        }
        await ArtisanBanner.findByIdAndDelete(id);
        // Remove the banner reference from the artisan
        if (banner.artisan) {
            await Artisan.findByIdAndUpdate(
                banner.artisan,
                { $unset: { artisanBanner: 1 } },
                { new: true }
            );
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Failed to delete banner', error: err.message }, { status: 500 });
    }
}

