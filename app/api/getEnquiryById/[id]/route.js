import connectDB from "@/lib/connectDB";
import Enquiry from "@/models/Enquiry";
import { NextResponse } from "next/server";
import Package from "@/models/Package";

export async function GET(req, { params }) {
    const { id } = await params
    await connectDB();
    try {
        const enquiry = await Enquiry.find({ userId: id }).populate("packageId");
        if (!enquiry) {
            return NextResponse.json({ message: "Enquiry not found" }, { status: 404 });
        }

        return NextResponse.json(enquiry, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching enquiry" }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    const { id } = await params
    await connectDB();

    try {
        const enquiry = await Enquiry.findOne({ id: id });
        if (!enquiry) {
            return NextResponse.json({ message: "Enquiry not found" }, { status: 404 });
        }

        const body = await req.json();
        const updatedEnquiry = await Enquiry.findOneAndUpdate({id}, body, { new: true });

        return NextResponse.json(updatedEnquiry, { status: 200 });
    } catch (error) {
        console.error("Error updating enquiry:", error);
        return NextResponse.json({ message: "Error updating enquiry" }, { status: 500 });
    }
}