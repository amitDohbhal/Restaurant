import connectDB from "@/lib/connectDB";
import Page from "@/models/Page";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";


// GET all webpages
export async function GET() {
    try {
        await connectDB();
        const pages = await Page.find();
        return NextResponse.json({ pages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch webpages", error: error.message }, { status: 500 });
    }
}

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")  // Remove special characters
        .trim()
        .replace(/\s+/g, "-"); // Replace spaces with dashes
};

// POST: Create a new webpage
export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        const { title, url } = await req.json();

        if (!title || !url) {
            return NextResponse.json({ message: "Title and URL are required!" }, { status: 400 });
        }

        const link = generateSlug(title); // Auto-generate link

        const newPage = new Page({ title, url, link });
        await newPage.save();

        return NextResponse.json({ message: "Webpage created successfully", page: newPage }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PATCH: Update an existing webpage
export async function PATCH(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        const { id, title, url } = await req.json();

        if (!id || !title || !url) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const link = generateSlug(title); // Auto-generate link

        const updatedPage = await Page.findByIdAndUpdate(
            id,
            { title, url, link },
            { new: true }
        );

        if (!updatedPage) {
            return NextResponse.json({ message: "Page not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Page updated successfully", page: updatedPage }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE: Remove a webpage
export async function DELETE(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Page ID is required" }, { status: 400 });
        }

        // Find the page to get the image key
        const pageToDelete = await Page.findById(id);

        if (!pageToDelete) {
            return NextResponse.json({ message: "Page not found" }, { status: 404 });
        }

        // Delete image from UploadThing before deleting from database
        if (pageToDelete.images?.key) {
            await deleteFileFromUploadthing(pageToDelete.images.key);
        }

        // Now delete the page from the database
        await Page.findByIdAndDelete(id);

        return NextResponse.json({ message: "Page and image deleted successfully" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}