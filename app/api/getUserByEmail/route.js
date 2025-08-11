import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectDB();
  
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "User not found!" },
        { status: 404 }
      );
    }

    // Return only necessary user data (exclude sensitive info)
    const userData = {
      id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      postalCode: user.postalCode,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
      // Add other fields as needed
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
