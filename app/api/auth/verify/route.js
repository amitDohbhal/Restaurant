import TempUser from '@/models/TempUser';
import User from '@/models/User';
import connectDB from '@/lib/connectDB';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    await connectDB();

    // Find the temporary user
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return NextResponse.json({ message: 'Invalid OTP or expired' }, { status: 400 });
    }

    // Verify the OTP
    if (tempUser.otp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // Save the user permanently
    await User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      isVerified: true,
      provider: 'Credentials',
    });

    // Delete the temporary user
    await TempUser.deleteOne({ email });

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}