import connectDB from "@/lib/connectDB";
import Specialization from "@/models/Specialization";
import { NextResponse } from "next/server";
// import { addSpecializationIfNotExists } from "@/lib/specialization";
// GET: Get all specializations
export async function GET() {
  await connectDB();
  try {
    const specs = await Specialization.find().sort({ name: 1 });
    return NextResponse.json(specs);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching specializations', error: error.message }, { status: 500 });
  }
}

// POST: Create a specialization
export async function POST(req) {
  await connectDB();
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ message: 'Specialization name is required' }, { status: 400 });
    const spec = await Specialization.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json(spec, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating specialization', error: error.message }, { status: 500 });
  }
}
