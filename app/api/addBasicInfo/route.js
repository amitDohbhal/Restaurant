import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import BasicInfo from "@/models/BasicInfo";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";


export async function GET() {
    await connectDB();
    try {
        const banners = await BasicInfo.find();
        return NextResponse.json(banners, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const data = await req.json();
        // Find the highest order number if not provided
        const newBanner = new BasicInfo({ ...data });
        await newBanner.save();
        return NextResponse.json(newBanner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create banner: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const body = await req.json();
        const id = body.id || body._id;
        if (!id) return NextResponse.json({ error: "Missing id for update" }, { status: 400 });
        const { id: _omitId, _id, ...updateFields } = body;
        const updatedBanner = await BasicInfo.findByIdAndUpdate(id, updateFields, { new: true });
        return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the banner first
        const banner = await BasicInfo.findById(id);
        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        // Delete the image from Uploadthing (if key exists)
        if (banner.image?.key) {
            await deleteFileFromCloudinary(banner.image.key);
        }

        // Delete banner from database
        await BasicInfo.findByIdAndDelete(id);

        return NextResponse.json({ message: "Banner deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete banner: ${error.message}` }, { status: 500 });
    }
}
