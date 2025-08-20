// category type
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import CategoryType from "@/models/CategoryType";

export async function GET() {
    await connectDB();
    try {
        const types = await CategoryType.find().sort({ createdAt: 1 });
        return NextResponse.json(types, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { categoryType } = await req.json();
        if (!categoryType || typeof categoryType !== 'string') {
            return NextResponse.json({ error: 'Category type is required' }, { status: 400 });
        }
        // Prevent duplicates
        const exists = await CategoryType.findOne({ categoryType });
        if (exists) {
            return NextResponse.json({ error: 'Category type already exists' }, { status: 409 });
        }
        const newType = await CategoryType.create({ categoryType });
        return NextResponse.json(newType, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}