import { NextResponse } from "next/server";
import User from "@/models/User";
import Newsletter from "@/models/NewsLetter";
import axios from "axios";
import connectDB from "@/lib/connectDB";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized access!" }, { status: 403 });
    }

    const { subject, message, recipients } = await req.json();

    if (!subject || !message || !recipients || recipients.length === 0) {
      return NextResponse.json({ success: false, message: "Subject, message, and at least one recipient are required." }, { status: 400 });
    }

    await connectDB();

    // First check in User collection
    const users = await User.find({ email: { $in: recipients } }, "email");
    
    // Then check in Newsletter collection for any remaining emails
    const newsletterEmails = await Newsletter.find({ email: { $in: recipients } }, "email");

    // Combine both results
    const allEmails = [
      ...users.map(user => user.email),
      ...newsletterEmails.map(item => item.email)
    ];

    if (allEmails.length === 0) {
      return NextResponse.json({ success: false, message: "No matching subscribers found." }, { status: 404 });
    }

    // Remove duplicates and format for Brevo
    const uniqueEmails = [...new Set(allEmails)];
    const emailRecipients = uniqueEmails.map(email => ({ email }));

    const emailData = {
      sender: { name: "Adventure Axis", email: "info@adventureaxis.in" },
      to: emailRecipients,
      subject,
      htmlContent: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promotional Email</title>
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
                        <td style="padding: 30px 0; text-align: center; background-color:rgb(176, 176, 176); border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <a href="https://adventureaxis.in/" class="header">
            <img src="https://adventureaxis.in/logo.png" alt="Adventure Axis Logo">
        </a>
                            <h1 style="color: #ffffff; margin: 0; margin-top:12px; font-size: 24px;">Promotional Email</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            ${message}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <div class="footer">
                            <p>In compliance of the Information Technology Act, 2000 and rules made thereunder and also in compliance of the Consumer Protection (E-Commerce) Rules, 2020 the name and contact details of the Grievance Officer are herein as under:</p>
                            <p>Working hours:</p>
                            <p>MON to SAT : 9:30AM - 08:00 PM</p>
                            <p>Sunday Closed</p>
            <p>If you have any questions, feel free to contact: <a href="mailto:info@adventureaxis.in">info@adventureaxis.in</a>.</p>
            <p>&copy; ${new Date().getFullYear()} Adventure Axis. All rights reserved.</p>
        </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
</body>
</html>
      `
    };

    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, message: 'Email service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json({ success: true, data: response.data }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    let errorMessage = 'Failed to send email. Please try again later.';
    if (error.response) {
      // Handle Brevo API specific errors
      if (error.response.status === 401) {
        errorMessage = 'Invalid API key. Please check your Brevo API configuration.';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = `Email service error: ${error.response.data.message}`;
      }
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}
