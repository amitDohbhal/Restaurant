import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/connectDB";
import Order from "@/models/Order"; 
import User from "@/models/User";

// Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials are not properly configured');
    throw new Error('Razorpay credentials are not properly configured');
}

// Initialize Razorpay client
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} catch (error) {
    console.error('Failed to initialize Razorpay:', error.message);
    throw new Error('Payment service initialization failed');
}

/**
 * Create a Razorpay Order
 * Handles order creation for both room invoices and e-commerce
 */
export async function POST(request) {
    try {
        await connectDB();
        
        // Parse request body
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { amount, currency = 'INR', receipt, notes = {}, customer } = requestBody;
        
        // Validate required fields
        if (amount === undefined || amount === null || !receipt) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: amount, receipt' },
                { status: 400 }
            );
        }

        // Create Razorpay order
        try {           
            const orderData = {
                amount: Math.round(Number(amount)),
                currency: currency.toUpperCase(),
                receipt: receipt.toString(),
                notes: {
                    ...notes,
                    ...(customer?.email && { customer_email: customer.email })
                },
                payment_capture: 1 // Auto-capture payment
            };
            

            
            const razorpayOrder = await razorpay.orders.create(orderData);
            
     

            if (!razorpayOrder?.id) {
                throw new Error('No order ID received from Razorpay');
            }
            return NextResponse.json({
                success: true,
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            });

        } catch (error) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to create payment order',
                    details: error.message,
                    code: error.code,
                    status: error.statusCode
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in POST /api/razorpay:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Verify Payment & Update Order Status
 * Handles payment verification for different payment types
 */
export async function PUT(request) {
    await connectDB();

    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
            console.log('Received payment verification request:', JSON.stringify(body, null, 2));
        } catch (e) {
            console.error('Error parsing request body:', e);
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { 
            razorpay_payment_id, 
            razorpay_order_id, 
            razorpay_signature, 
            type, 
            invoiceId 
        } = body;

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json(
                { success: false, error: 'Missing required payment parameters' },
                { status: 400 }
            );
        }

        // Verify the payment signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json(
                { success: false, error: 'Invalid payment signature' },
                { status: 400 }
            );
        }
        // Fetch Full Payment Details from Razorpay
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
            throw new Error('Failed to fetch payment details from Razorpay');
        }
        // Handle regular order payments
        const { orderId } = body;
        
        if (!orderId) {
            console.error('Order ID is required in the request body');
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        try {
            // Import the RunningOrder model
            const RunningOrder = (await import('@/models/RunningOrder')).default;
            
            // Find the order first
            console.log('Looking for order with ID:', orderId);
            const order = await RunningOrder.findById(orderId);
            
            if (!order) {
                console.error('Order not found with ID:', orderId);
                return NextResponse.json(
                    { success: false, error: 'Order not found' },
                    { status: 404 }
                );
            }

            console.log('Found order:', JSON.stringify(order, null, 2));
            
            // Update order with payment details
            const updateData = {
                status: 'confirmed',
                paymentStatus: 'paid',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                payment: {
                    method: paymentDetails.method,
                    status: 'completed',
                    transactionId: razorpay_payment_id,
                    paymentDetails: {
                        bank: paymentDetails.bank || null,
                        cardType: paymentDetails.card?.type || null,
                        vpa: paymentDetails.vpa || null,
                        wallet: paymentDetails.wallet || null
                    },
                    paidAt: new Date()
                },
                updatedAt: new Date()
            };

            console.log('Updating order with data:', JSON.stringify(updateData, null, 2));
            
            // Update the order
            const updatedOrder = await RunningOrder.findByIdAndUpdate(
                orderId,
                { $set: updateData },
                { new: true }
            );
            
            if (!updatedOrder) {
                throw new Error('Failed to update order after payment');
            }
            
            console.log('Order updated successfully:', updatedOrder._id);
            
            // Return success response with updated order data
            return NextResponse.json({
                success: true,
                orderId: updatedOrder._id,
                orderNumber: updatedOrder.orderNumber,
                paymentId: razorpay_payment_id,
                paymentMethod: paymentDetails.method,
                paymentStatus: 'completed',
                amount: updatedOrder.total,
                bank: paymentDetails.bank || null,
                cardType: paymentDetails.card?.type || null,
                message: 'Payment verified and order confirmed successfully'
            });
            
        } catch (error) {
            console.error('Error updating order:', error);
            throw error; // This will be caught by the outer catch block
        }
    } catch (error) {
        // console.error("Error verifying Razorpay payment:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Payment verification failed" },
            { status: 500 }
        );
    }
}