import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { id } = await params; // No need for "await" here

        if (!id) {
            return NextResponse.json({ error: "Invalid request, ID is required" }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
        }

        const productData = await Product.findById(id);

        if (!productData) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        return NextResponse.json(productData, { status: 200 });
    } catch (error) {
        console.error("Error fetching package:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
