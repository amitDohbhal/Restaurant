import connectDB from "@/lib/connectDB";
import Enquiry from "@/models/Enquiry";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connectDB();

        const body = await req.json();
        const { packageId, email } = body;

        const existingEnquiry = await Enquiry.findOne({ packageId, email });
        if (existingEnquiry) {
            return NextResponse.json({ message: "You have already submitted an enquiry for this package" }, { status: 400 });
        }

        const enquiry = new Enquiry(body);
        await enquiry.save();

        return NextResponse.json({ message: "Enquiry submitted successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error saving enquiry:", error);
        return NextResponse.json({ message: "Error saving enquiry" }, { status: 500 });
    }
}
