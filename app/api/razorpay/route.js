import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/connectDB';
import CreateRoomInvoice from '@/models/CreateRoomInvoice';
import CreateRestaurantInvoice from '@/models/CreateRestaurantInvoice';
import RunningOrder from '@/models/RunningOrder';
import CreateDirectFoodInvoice from '@/models/CreateDirectFoodInvoice';
// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function POST(req) {
    await connectDB();

    try {
        const body = await req.json();
        const { amount, currency = 'INR', receipt, notes } = body;

        if (!amount || !receipt) {
            return NextResponse.json(
                { success: false, error: 'Amount and receipt are required' },
                { status: 400 }
            );
        }

        const options = {
            amount: Math.round(amount), // Razorpay expects amount in paise
            currency,
            receipt,
            payment_capture: 1,
            notes
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to create order',
                details: error
            },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    await connectDB();

    try {
        const body = await req.json();
        const {
            type,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            invoiceId,
        } = body;

        console.log('Received payment verification request:', JSON.stringify(body, null, 2));

        // Verify the payment signature
        const crypto = require('crypto');
        const text = razorpay_order_id + '|' + razorpay_payment_id;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        console.log('Verifying payment signature:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            receivedSignature: razorpay_signature,
            generatedSignature,
            keySecret: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing',
            signatureMatches: generatedSignature === razorpay_signature
        });

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid payment signature',
                    details: {
                        message: 'The payment signature could not be verified',
                        code: 'SIGNATURE_VERIFICATION_FAILED'
                    }
                },
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
        const { orderId } = body;
        // Handle different payment types
        if (type === 'room_invoice' && invoiceId) {
            console.log('Processing room invoice payment for invoice ID:', invoiceId);

            const updateData = {
                paymentStatus: 'completed',
                paidAmount: paymentDetails.amount / 100, // Convert from paise to rupees
                dueAmount: 0,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpaySignature: razorpay_signature,
                paymentDate: new Date()
            };

            const updatedInvoice = await CreateRoomInvoice.findByIdAndUpdate(
                invoiceId,
                updateData,
                { new: true }
            );

            if (!updatedInvoice) {
                console.error('Room invoice not found with ID:', invoiceId);
                return NextResponse.json(
                    { success: false, error: 'Room invoice not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Payment verified and room invoice updated successfully',
                invoice: updatedInvoice
            });
        }
        else if (type === 'restaurant' && invoiceId) {
            console.log('Processing restaurant invoice payment for invoice ID:', invoiceId);

            const updateData = {
                paymentStatus: 'completed',
                paidAmount: paymentDetails.amount / 100, // Convert from paise to rupees
                dueAmount: 0,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpaySignature: razorpay_signature,
                paymentDate: new Date()
            };

            const updatedInvoice = await CreateRestaurantInvoice.findByIdAndUpdate(
                invoiceId,
                updateData,
                { new: true }
            );

            if (!updatedInvoice) {
                console.error('Restaurant invoice not found with ID:', invoiceId);
                return NextResponse.json(
                    { success: false, error: 'Restaurant invoice not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Payment verified and restaurant invoice updated successfully',
                invoice: updatedInvoice
            });
        }
        else if (type === 'direct_food_order' && invoiceId) {
            console.log('Processing direct food order payment for invoice ID:', invoiceId);

            // Common update data for all invoice types
            const commonUpdateData = {
                paymentStatus: 'completed',
                paidAmount: paymentDetails.amount / 100, // Convert from paise to rupees
                dueAmount: 0,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id || paymentDetails.order_id,
                razorpaySignature: razorpay_signature,
                paymentDate: new Date(),
                paymentDetails: paymentDetails // Store complete payment details for reference
            };
            const updatedInvoice = await CreateDirectFoodInvoice.findByIdAndUpdate(
                invoiceId,
                { $set: commonUpdateData },
                { new: true }
            );
            if (!updatedInvoice) {
                console.error('Direct food order invoice not found with ID:', invoiceId);
                return NextResponse.json(
                    { success: false, error: 'Direct food order invoice not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Payment verified and direct food order invoice updated successfully',
                invoice: updatedInvoice
            });
        }
        else if (orderId) {
            // Handle regular order payment
            console.log('Processing regular order payment for order ID:', orderId);

            const order = await RunningOrder.findById(orderId);
            if (!order) {
                return NextResponse.json(
                    { success: false, error: 'Order not found' },
                    { status: 404 }
                );
            }

            // Update order status
            order.paymentStatus = 'completed';
            order.paymentDetails = {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                method: 'razorpay',
                status: 'captured',
                amount: paymentDetails.amount / 100, // Convert from paise to rupees
                currency: paymentDetails.currency,
                timestamp: new Date()
            };

            await order.save();

            return NextResponse.json({
                success: true,
                message: 'Payment verified and order updated successfully',
                order
            });
        }
        else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request. Either orderId or invoiceId with type must be provided',
                    receivedData: {
                        type,
                        invoiceId,
                        orderId
                    }
                },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error processing payment verification:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to verify payment',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}