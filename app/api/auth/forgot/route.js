import User from '@/models/User';
import connectDB from '@/lib/connectDB';
import { sendOTP } from '@/lib/brevo';
import { NextResponse } from 'next/server';

export async function POST(req) {
    await connectDB();

    try {
        const { email } = await req.json();
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user document
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = expiresAt;
        await user.save();

        const message = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style type="text/css">
    .header {
            text-align: center;
            padding: 20px 0;
        }
        .header img {
            max-width: 300px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content {
                padding: 20px !important;
            }
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
            border-top: 1px solid #eeeeee;
            margin-top: 20px;
        }
        .footer a {
            color: #007BFF;
            text-decoration: none;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="container" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 0; text-align: center; background-color: #ECB504; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <a href="https://adventureaxis.in/" class="header">
            <img src="https://adventureaxis.in/logo.png" alt="Adventure Axis Logo">
        </a>
                            <h1 style="color: #ffffff; margin: 0; margin-top:12px; font-size: 24px;">Password Reset Request</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="margin-top: 0; color: #333333; font-size: 16px; line-height: 1.5;">Hello, ${email}</p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Please use the following code to complete the password reset process:</p>
                            <div style="background-color: #f8f9fa; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ECB504;">${otp}</span>
                            </div>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">This code will expire in 10 minutes.</p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email. Your account security is important to us.</p>
                            
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                           <div class="footer">
            <p>If you have any questions, feel free to contact: <a href="mailto:info@adventureaxis.in">info@adventureaxis.in</a>.</p>
            <p>&copy; ${new Date().getFullYear()} Rishikesh HandMade. All rights reserved.</p>
        </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

        const subject = 'Password Reset Request';

        // Send OTP via Brevo
        const otpSent = await sendOTP(email, otp, message, subject);
        if (!otpSent) {
            return NextResponse.json({ message: 'Failed to send OTP' }, { status: 201 });
        }

        return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}