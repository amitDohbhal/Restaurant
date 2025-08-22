// food category
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Vendor from "@/models/Vendor";


export async function GET() {
    await connectDB();
    try {
        const vendors = await Vendor.find();
        return NextResponse.json(vendors, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { vendors } = await req.json();
        const newVendor = new Vendor({ vendors });
        await newVendor.save();
        return NextResponse.json(newVendor, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create vendors: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, vendors } = await req.json();
        const updatedVendor = await Vendor.findByIdAndUpdate(id, { vendors }, { new: true });
        return NextResponse.json(updatedVendor, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update vendors" }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the vendor first
        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Delete vendor from database
        await Vendor.findByIdAndDelete(id);

        return NextResponse.json({ message: "Vendor deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete vendor: ${error.message}` }, { status: 500 });
    }
}
