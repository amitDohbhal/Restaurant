import { NextResponse } from "next/server";
import Package from "@/models/Package"; // Assuming you have a Package model
import connectDB from "@/lib/connectDB";

export async function GET(req) {
    await connectDB(); // Connect to MongoDB
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        const packages = await Package.find({
            packageName: { $regex: query, $options: "i" } // Case-insensitive search
        })
        .limit(5) // Limit results for dropdown
        .select("packageName _id basicDetails.thumbnail.url basicDetails.location"); // Return only necessary fields

        return NextResponse.json(packages, { status: 200 });
    } catch (error) {
        console.error("Error fetching packages:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
