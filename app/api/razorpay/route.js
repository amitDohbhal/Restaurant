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
        } catch (e) {
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

        // Handle room and restaurant invoice payments
        if ((type === 'room' || type === 'restaurant' || type === 'directFood') && invoiceId) {
            try {
                let invoice;
                if (type === 'room') {
                    const RoomInvoice = (await import('@/models/CreateRoomInvoice')).default;
                    invoice = await RoomInvoice.findById(invoiceId);
                } else if (type === 'restaurant') {
                    const RestaurantInvoice = (await import('@/models/CreateRestaurantInvoice')).default;
                    invoice = await RestaurantInvoice.findById(invoiceId);
                } else if (type === 'directFood') {
                    const DirectFoodInvoice = (await import('@/models/CreateDirectFoodInvoice')).default;
                    invoice = await DirectFoodInvoice.findById(invoiceId);
                }
                
                if (!invoice) {
                    return NextResponse.json(
                        { success: false, error: 'Invoice not found' },
                        { status: 404 }
                    );
                }

                // Update invoice with payment details
                invoice.paymentStatus = 'completed';
                invoice.paymentDate = new Date();
                invoice.paymentId = razorpay_payment_id;
                invoice.orderId = razorpay_order_id;
                invoice.signature = razorpay_signature;
                
                // For restaurant invoices, update paidAmount and dueAmount
                if (type === 'restaurant') {
                    invoice.paidAmount = invoice.totalAmount || 0;
                    invoice.dueAmount = 0;
                }
                
                await invoice.save();

                return NextResponse.json({
                    success: true,
                    message: 'Payment verified successfully',
                    invoiceId: invoice._id,
                    paymentStatus: 'completed'
                });

            } catch (error) {
                console.error('Error updating room invoice:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to update invoice' },
                    { status: 500 }
                );
            }
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
        if (paymentResponse.ok) {
            order.bank = paymentDetails.bank || null;
            order.cardType = paymentDetails.card?.type || null;
        }
        // Return user-facing orderId and payment details
        return NextResponse.json({
            success: true,
            orderId: order.orderId,
            paymentId: razorpay_payment_id,
            paymentMethod: paymentDetails.method,
            paymentStatus: paymentDetails.status,
            bank: paymentDetails.bank || null,
            cardType: paymentDetails.card?.type || null,
        });
    } catch (error) {
        // console.error("Error verifying Razorpay payment:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Payment verification failed" },
            { status: 500 }
        );
    }
}