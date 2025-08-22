import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import StockQuantityType from "@/models/StockQuantityType";

export async function GET() {
  await connectDB();
  try {
    const types = await StockQuantityType.find().sort({ createdAt: -1 });
    return NextResponse.json(types, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quantity types" }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const exists = await StockQuantityType.findOne({ name });
    if (exists) return NextResponse.json({ error: 'Quantity type already exists' }, { status: 409 });
    
    const type = await StockQuantityType.create({ name });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create quantity type: ${error.message}` }, { status: 500 });
  }
}
