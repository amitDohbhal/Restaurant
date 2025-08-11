import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(req) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ message: "User not found!" }, { status: 404 });
        }

        const { firstName, lastName, dateOfBirth, name, email, phone, address, city, state, postalCode, country } = await req.json();

        if ( !firstName || !lastName || !email || !phone || !address || !city || !state || !postalCode || !country) {
            return NextResponse.json({ message: "All fields are required!" }, { status: 400 });
        }

        user.name = name;
        user.firstName = firstName;
        user.lastName = lastName;
        user.dateOfBirth = dateOfBirth;
        user.email = email;
        user.phone = phone;
        user.address = address;
        user.city = city;
        user.state = state;
        user.postalCode = postalCode;
        user.country = country;

        await user.save();

        return NextResponse.json({ message: "User updated successfully!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}