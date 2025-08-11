import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().select("name phone email provider createdAt");
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}
