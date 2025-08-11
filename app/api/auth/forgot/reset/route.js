import User from '@/models/User';
import connectDB from '@/lib/connectDB';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
    await connectDB();

    try {
        const { email, newPassword, confirmPassword } = await req.json();
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
        }

        // Check if OTP was verified
        if (!user.isOtpVerified || user.resetPasswordExpires < new Date()) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        user.isOtpVerified = undefined;
        await user.save();

        return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}