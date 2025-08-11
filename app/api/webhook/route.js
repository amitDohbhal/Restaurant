// api/webhook.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/models/Order"; // Import your Order model
import axios from "axios";
import connectDB from "@/lib/connectDB";

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify the webhook signature
        const generatedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (generatedSignature !== signature) {
            return NextResponse.json(
                { success: false, error: "Invalid signature" },
                { status: 400 }
            );
        }

        const event = JSON.parse(body);

        // Handle payment.failed event
        if (event.event === "payment.failed") {
            const payment = event.payload.payment.entity;

            // Find the order by payment ID
            const order = await Order.findOne({ orderId: payment.order_id });

            if (order) {
                // Update the order status to "Failed"
                order.status = "Failed";
                order.transactionId = payment.id;
                await order.save();

                // Fetch package name (assuming it's stored in the order)
                const packageName = order.packageName;

                // Send payment failed email
                await axios.post("/api/brevo", {
                    to: order.email,
                    subject: "Payment Failed",
                    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
        .transaction-summary { background-color: #fff0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .transaction-summary p { margin: 5px 0; font-size: 14px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
        .header h1 { margin: 0; font-size: 24px; color: #dc3545; }
        .content { padding: 20px 0; }
        .content p { margin: 10px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="transaction-summary">
            <p><strong>Payment Failed!</strong></p>
            <p><strong>Amount:</strong> ₹${order.amount}</p>
            <p><strong>Payment ID:</strong> ${payment.id}</p>
            <p><strong>Reason:</strong> ${payment.error_description || "Unknown"}</p>
        </div>
        <div class="header">
            <h1>Payment Failed</h1>
        </div>
        <div class="content">
            <p>Dear ${order.name},</p>
            <p>We regret to inform you that your payment for <strong>${packageName}</strong> has failed. Below are the details:</p>
            <p><strong>Amount:</strong> ₹${order.amount}</p>
            <p><strong>Payment ID:</strong> ${payment.id}</p>
            <p><strong>Reason:</strong> ${payment.error_description || "Unknown"}</p>
            <p>Please try again or contact our support team for assistance.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:support@yatrazone.com">support@yatrazone.com</a>.</p>
        </div>
    </div>
</body>
</html>`,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error handling webhook:", error.message); // Log the error message
        return NextResponse.json(
            { success: false, error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

// Reject non-POST requests
export async function GET() {
    return NextResponse.json(
        { success: false, error: "Method Not Allowed" },
        { status: 405 }
    );
}