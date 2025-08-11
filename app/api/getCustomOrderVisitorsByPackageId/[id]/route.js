import connectDB from "@/lib/connectDB";
import CustomOrderVisitors from "@/models/CustomOrderVisitors";
import Package from "@/models/Package";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    await connectDB();
    const { id } = await params;
    try {
        const customOrderVisitors = await CustomOrderVisitors.findOne({ packageId: id }).lean();
        return NextResponse.json({ customOrderVisitors }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}