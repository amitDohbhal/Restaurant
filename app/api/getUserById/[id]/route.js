import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    await connectDB();
    const { id } = await params
    try {

        if (!id) {
            return NextResponse.json(
                { message: "Id parameter is required" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ _id: id });

        if (!user) {
            return NextResponse.json(
                { message: "User not found!" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        await User.findByIdAndDelete(id);
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting user" }, { status: 500 });
    }
}