import connectDB from "@/lib/connectDB";
import Page from "@/models/Page";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();

        const data = await Page.find({});

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}