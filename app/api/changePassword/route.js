import { hash, compare } from "bcryptjs";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { email, currentPassword, newPassword } = await req.json();

        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: "User not found!" }, { status: 404 });
        }

        // Check if the current password matches the user's actual password
        const isMatch = await compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Incorrect current password!" }, { status: 401 });
        }

        // Hash the new password before saving
        const hashedPassword = await hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({ message: "Password changed successfully!" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
