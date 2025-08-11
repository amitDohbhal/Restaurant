import connectDB from "@/lib/connectDB";
import Package from "@/models/Package";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    // Get the total count of packages to ensure we don't request more than available
    const totalPackages = await Package.countDocuments();

    // Determine how many packages to return (minimum of 3 or total available)
    const limit = Math.min(10, totalPackages);

    // Only fetch active packages
    const randomPackages = await Package.aggregate([
      { $match: { active: true } }, // Only active packages
      { $sample: { size: limit } }
    ]);

    return NextResponse.json({ packages: randomPackages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}