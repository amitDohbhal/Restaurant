import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import CustomOrder from "@/models/CustomOrder";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 📌 Create a Razorpay Order
export async function POST(request) {
    await connectDB();
    try {
        const { userId, packageId, totalAmount, amount, currency, receipt, formData, bookingDetails, heliFormData, customPackageForm  } =
            await request.json();

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100, // ₹1 = 100 paise
            currency,
            receipt,
        });

        if (!razorpayOrder || !razorpayOrder.id) {
            throw new Error("Failed to create Razorpay order");
        }

        // Create an Order document in MongoDB
        const newOrder = new CustomOrder({
            orderId: razorpayOrder.id, // Razorpay order ID
            userId,
            packageId,
            amount,
            totalAmount,
            formData,
            bookingDetails,
            heliFormData,
            customPackageForm,
            status: "Pending",
            customOrder: true
        });

        await newOrder.save();

        return NextResponse.json(razorpayOrder);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}

// 📌 Verify Payment & Fetch Payment Details
export async function PUT(request) {
    await connectDB();
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
            await request.json();

        // ✅ Step 1: Verify Razorpay Signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json(
                { success: false, error: "Invalid signature" },
                { status: 400 }
            );
        }

        // ✅ Step 2: Fetch Full Payment Details from Razorpay
        const paymentResponse = await fetch(
            `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${Buffer.from(
                        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
                    ).toString("base64")}`,
                },
            }
        );

        const paymentDetails = await paymentResponse.json();

        if (!paymentResponse.ok) {
            throw new Error("Failed to fetch payment details");
        }

        // ✅ Step 3: Extract Payment Method
        const paymentMethod = paymentDetails.method; // e.g., "upi", "card", "netbanking"
        const paymentStatus = paymentDetails.status; // e.g., "captured"
        const bank = paymentDetails.bank || null; // If paid via Net Banking
        const cardType = paymentDetails.card?.type || null; // If paid via Card

        // ✅ Step 4: Find and Update the Order
        const order = await CustomOrder.findOne({ orderId: razorpay_order_id });

        if (!order) {
            throw new Error("Order not found");
        }

        // Update the order with transaction details
        order.transactionId = razorpay_payment_id;
        order.status = paymentStatus === "captured" ? "Paid" : "Failed";
        order.paymentMethod = paymentMethod;
        order.bank = bank;
        order.cardType = cardType;

        await order.save();

        const user = await User.findOne({ _id: order.userId });

        if (!user) {
            throw new Error("User not found");
        }

        if (order.status === "Paid") {
           user.packages.push(order.packageId);
            await user.save();
        }

        // ✅ Step 5: Return Payment Details
        return NextResponse.json({
            success: true,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentMethod,
            paymentStatus,
            bank,
            cardType,
            order,
        });
    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        return NextResponse.json(
            { success: false, error: "Payment verification failed" },
            { status: 500 }
        );
    }
}