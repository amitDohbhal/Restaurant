import connectDB from "@/lib/connectDB";
import Package from "@/models/Package";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    // Get search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ packages: [] }, { status: 200 });
    }

    // Search MongoDB for matching packages
    const searchQuery = {
      $or: [
        { packageCode: { $regex: query, $options: "i" } },
        { packageName: { $regex: query, $options: "i" } },
        { "basicDetails.location": { $regex: query, $options: "i" } },
        { "vehiclePlan.pickup.city": { $regex: query, $options: "i" } }, // Search city in pickup
        { "vehiclePlan.pickup.state": { $regex: query, $options: "i" } }, // Search state in pickup
        { "vehiclePlan.drop.city": { $regex: query, $options: "i" } }, // Search city in drop
        { "vehiclePlan.drop.state": { $regex: query, $options: "i" } }, // Search state in drop
      ],
    };

    const packages = await Package.find(searchQuery).lean();

    return NextResponse.json({ packages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}