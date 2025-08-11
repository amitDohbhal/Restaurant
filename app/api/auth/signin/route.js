import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { email, password } = body;

        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found!" }, { status: 404 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ message: "Please verify your email before logging in." }, { status: 401 });
        }

        return NextResponse.json({ message: "Login successful!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}