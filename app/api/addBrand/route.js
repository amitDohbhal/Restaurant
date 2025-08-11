import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Brand from "@/models/Brand";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";


export async function GET() {
    await connectDB();
    try {
        const banners = await Brand.find().sort({ order: 1 });
        return NextResponse.json(banners, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
    }
}

export async function POST(req) {
        await connectDB();
    try {
        const { buttonLink,slug, frontImg, order } = await req.json();

        // Find the highest order number
        const lastBanner = await Brand.findOne().sort({ order: -1 });
        const nextOrder = lastBanner ? lastBanner.order + 1 : 1; // Auto-increment order

        const newBanner = new Brand({
            buttonLink,
            order: nextOrder,
            slug,
            frontImg,
        
        });
        await newBanner.save();
        return NextResponse.json(newBanner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create brand: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
        await connectDB();
    try {
        const { id, buttonLink,slug, frontImg,order } = await req.json();
        const updatedBanner = await Brand.findByIdAndUpdate(
            id,
            {
                buttonLink,
                slug,
                order,
                frontImg,
            },
            { new: true }
        );
        return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }
}

export async function DELETE(req) {
        await connectDB();
    try {
        const { id } = await req.json();
        // Find the banner first
        const banner = await Brand.findById(id);
        if (!banner) {
            return NextResponse.json({ error: "brand not found" }, { status: 404 });
        }
        // Delete the image from Uploadthing (if key exists)
        if (banner.frontImg?.key) {
            await deleteFileFromCloudinary(banner.frontImg.key);
        }
        // Delete banner from database
        await Brand.findByIdAndDelete(id);
        return NextResponse.json({ message: "brand deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete brand: ${error.message}` }, { status: 500 });
    }
}
