import TempUser from '@/models/TempUser';
import connectDB from '@/lib/connectDB';
import { sendOTP } from '@/lib/brevo';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email } = await req.json();

    await connectDB();

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return NextResponse.json({ message: 'Email not found or expired' }, { status: 400 });
    }

    // Generate a new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update the OTP in the TempUser
    tempUser.otp = newOtp;
    await tempUser.save();

    const message = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code for Verification</title>
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
                        <td style="padding: 30px 0; text-align: center; background-color: #4F46E5; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <a href="https://info@adventureaxis.in" class="header">
            <img src="https://info@adventureaxis.in/logo.png" alt="Rishikesh HandMade Logo">
        </a>
                            <h1 style="color: #ffffff; margin: 0; margin-top:12px; font-size: 24px;">Verification Code</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="margin-top: 0; color: #333333; font-size: 16px; line-height: 1.5;">Hello, ${email}</p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">Thank you for signing up with <span style="font-weight: 900; color: #4F46E5;">YatraZone!</span>. Please use the following verification code to complete your sign-in:</p>
                            <div style="background-color: #f8f9fa; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${newOtp}</span>
                            </div>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <div class="footer">
            <p>If you have any questions, feel free to <a href="https://www.yatrazone.com/contact">contact us</a>.</p>
            <p>&copy; ${new Date().getFullYear()} YatraZone. All rights reserved.</p>
        </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
</body>
</html>`

    const subject = 'Verify Your Email';

    // Resend the OTP
    const otpSent = await sendOTP(email, newOtp, message, subject);
    if (!otpSent) {
      return NextResponse.json({ message: 'Failed to resend OTP' }, { status: 201 });
    }

    return NextResponse.json({ message: 'New OTP sent' }, { status: 200 });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}