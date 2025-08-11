import User from '@/models/User';
import connectDB from '@/lib/connectDB';
import { NextResponse } from 'next/server';

export async function POST(req) {
    await connectDB();
    
    try {
        const { email, otp } = await req.json();
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if OTP matches and hasn't expired
        if (user.resetPasswordOtp !== parseInt(otp) || user.resetPasswordExpires < new Date()) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Mark OTP as verified
        user.isOtpVerified = true;
        await user.save();

        return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });

    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}