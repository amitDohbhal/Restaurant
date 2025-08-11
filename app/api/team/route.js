import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Team from "@/models/Team";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";

export async function GET() {

    try {
        await connectDB();
        const banners = await Team.find().sort({ order: 1 });
        return NextResponse.json(banners, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch Associate" }, { status: 500 });
    }
}

export async function POST(req) {

    try {
        await connectDB();
        const { title, designation, image, order } = await req.json();

        // Find the highest order number
        const lastBanner = await Team.findOne().sort({ order: -1 });
        const nextOrder = lastBanner ? lastBanner.order + 1 : 1; // Auto-increment order

        const newBanner = new Team({ title, designation, order: nextOrder, image });
        await newBanner.save();
        return NextResponse.json(newBanner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create Associate: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {

    try {
        await connectDB();
        const { id, title, designation, image, order } = await req.json();
        const updatedBanner = await Team.findByIdAndUpdate(id, { title, designation, order, image }, { new: true });
        return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update Associate" }, { status: 500 });
    }
}

export async function DELETE(req) {

    try {
        await connectDB();
        const { id } = await req.json();

        // Find the banner first
        const banner = await Team.findById(id);
        if (!banner) {
            return NextResponse.json({ error: "Associate not found" }, { status: 404 });
        }

        // Delete the image from Uploadthing (if key exists)
        if (banner.image?.key) {
            await deleteFileFromCloudinary(banner.image.key);
        }

        // Delete banner from database
        await Team.findByIdAndDelete(id);

        return NextResponse.json({ message: "Associate deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete Associate: ${error.message}` }, { status: 500 });
    }
}
