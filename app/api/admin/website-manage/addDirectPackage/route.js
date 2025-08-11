import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";
import Package from "@/models/Package";

export async function POST(req) {
    try {
        await connectDB();
        
        const body = await req.json();
        const { packages } = body;

        // Validate required fields
        if (!packages?.packageName || !packages?.price || !packages?.priceUnit) {
            return NextResponse.json(
                { success: false, message: "Package name, price and price unit are required" },
                { status: 400 }
            );
        }

        // Create new direct package
        const newPackage = new Package({
            ...packages,
            isDirect: true,
            active: true,
            order: await Package.countDocuments({ isDirect: true }) + 1
        });

        await newPackage.save();

        return NextResponse.json(
            { success: true, message: "Direct package added successfully", package: newPackage },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error adding direct package:", error);
        return NextResponse.json(
            { success: false, message: "Failed to add direct package", error: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();
        const packages = await Package.find({ isDirect: true })
            .sort({ order: 1 })
            .lean();
            
        return NextResponse.json({ success: true, packages });
    } catch (error) {
        console.error("Error fetching direct packages:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch direct packages" },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Package ID is required" },
                { status: 400 }
            );
        }

        const deletedPackage = await Package.findByIdAndDelete(id);

        if (!deletedPackage) {
            return NextResponse.json(
                { success: false, message: "Package not found" },
                { status: 404 }
            );
        }

        // Reorder remaining packages
        await Package.updateMany(
            { isDirect: true, order: { $gt: deletedPackage.order } },
            { $inc: { order: -1 } }
        );

        return NextResponse.json(
            { success: true, message: "Direct package deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting direct package:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete direct package" },
            { status: 500 }
        );
    }
}

export async function PATCH(req) {
    try {
        await connectDB();
        const { pkgId, active } = await req.json();

        if (!pkgId || typeof active !== 'boolean') {
            return NextResponse.json(
                { success: false, message: "Invalid request data" },
                { status: 400 }
            );
        }

        const updatedPackage = await Package.findByIdAndUpdate(
            pkgId,
            { active },
            { new: true }
        );

        if (!updatedPackage) {
            return NextResponse.json(
                { success: false, message: "Package not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Package status updated", package: updatedPackage },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating package status:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update package status" },
            { status: 500 }
        );
    }
}