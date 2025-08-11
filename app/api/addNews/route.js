import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import News from "@/models/News";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";

export async function GET() {
    await connectDB();
    try {
        const news = await News.find().sort({ createdAt: -1});
        return NextResponse.json(news, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { title, date, description, image, order } = await req.json();

        // Find the highest order number
        const lastNews = await News.findOne().sort({ order: -1 });
        const nextOrder = lastNews ? lastNews.order + 1 : 1; // Auto-increment order

        const newNews = new News({ title, date, description, order: nextOrder, image });
        await newNews.save();
        return NextResponse.json(newNews, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create news: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, title, date, description, image, order } = await req.json();
        const updatedNews = await News.findByIdAndUpdate(id, { title, date, description, order, image }, { new: true });
        return NextResponse.json(updatedNews, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the news first
        const news = await News.findById(id);
        if (!news) {
            return NextResponse.json({ error: "News not found" }, { status: 404 });
        }

        // Delete the image from Uploadthing (if key exists)
        if (news.image?.key) {
            await deleteFileFromCloudinary(news.image.key);
        }

        // Delete news from database
        await News.findByIdAndDelete(id);

        return NextResponse.json({ message: "News deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete news: ${error.message}` }, { status: 500 });
    }
}
