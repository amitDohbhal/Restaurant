import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import CategoryAdvertisment from "@/models/CategoryAdvertisment";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";
connectDB();

export async function GET() {
    try {
        const banners = await CategoryAdvertisment.find().sort({ order: 1 });
        return NextResponse.json(banners, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch  Advertisment Banner" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { buttonLink, image, order } = await req.json();

        // Find the highest order number
        const lastBanner = await CategoryAdvertisment.findOne().sort({ order: -1 });
        const nextOrder = lastBanner ? lastBanner.order + 1 : 1; // Auto-increment order

        const newBanner = new CategoryAdvertisment({  buttonLink, order: nextOrder, image });
        await newBanner.save();
        return NextResponse.json(newBanner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create  Advertisment Banner: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { id, buttonLink, image, order } = await req.json();
        const updatedBanner = await CategoryAdvertisment.findByIdAndUpdate(id, { buttonLink, order, image }, { new: true });
        return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update Advertisment Banner" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();

        // Find the banner first
        const banner = await CategoryAdvertisment.findById(id);
        if (!banner) {
            return NextResponse.json({ error: " Advertisment Banner not found" }, { status: 404 });
        }

        // Delete the image from Uploadthing (if key exists)
        if (banner.image?.key) {
            await deleteFileFromCloudinary(banner.image.key);
        }

        // Delete banner from database
        await CategoryAdvertisment.findByIdAndDelete(id);

        return NextResponse.json({ message: " Advertisment Banner deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete  Advertisment Banner: ${error.message}` }, { status: 500 });
    }
}
