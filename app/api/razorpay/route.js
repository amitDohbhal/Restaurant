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
    console.log('Initializing Razorpay...');
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    // Test the connection
    await razorpay.orders.all({ count: 1 });
    console.log('Razorpay initialized successfully');
} catch (error) {
    console.error('Failed to initialize Razorpay:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        key_id: process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
        key_secret: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing',
        stack: error.stack
    });
    throw new Error(`Payment service initialization failed: ${error.message}`);
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
            // Validate amount (minimum 100 paise = 1 INR for Razorpay)
            const amountInPaise = Math.round(Number(amount));
            if (isNaN(amountInPaise) || amountInPaise < 100) {
                throw new Error(`Invalid amount: ${amountInPaise} paise (minimum 100 paise = 1 INR)`);
            }

            const orderData = {
                amount: amountInPaise,
                currency: (currency || 'INR').toUpperCase(),
                receipt: receipt.toString(),
                notes: {
                    ...notes,
                    ...(customer?.email && { customer_email: customer.email })
                },
                payment_capture: 1 // Auto-capture payment
            };
            
            console.log('Creating Razorpay order with data:', {
                ...orderData,
                key_id: '***' + (process.env.RAZORPAY_KEY_ID || '').slice(-4)
            });
            
            let razorpayOrder;
            try {
                razorpayOrder = await razorpay.orders.create(orderData);
                console.log('Razorpay order response:', {
                    id: razorpayOrder?.id,
                    amount: razorpayOrder?.amount,
                    currency: razorpayOrder?.currency,
                    status: razorpayOrder?.status
                });
            } catch (razorpayError) {
                console.error('Razorpay API error:', {
                    message: razorpayError.message,
                    statusCode: razorpayError.statusCode,
                    error: razorpayError.error,
                    stack: razorpayError.stack
                });
                
                let errorMessage = 'Failed to create payment order';
                if (razorpayError.error?.description) {
                    errorMessage = razorpayError.error.description;
                } else if (razorpayError.message) {
                    errorMessage = razorpayError.message;
                }
                
                return NextResponse.json(
                    { 
                        success: false, 
                        error: errorMessage,
                        details: razorpayError.error || razorpayError.message,
                        code: razorpayError.code || razorpayError.statusCode
                    },
                    { status: 400 }
                );
            }

            if (!razorpayOrder?.id) {
                console.error('Invalid response from Razorpay:', razorpayOrder);
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

        console.log('Verifying payment signature:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            receivedSignature: razorpay_signature,
            generatedSignature,
            keySecret: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing',
            signatureMatches: generatedSignature === razorpay_signature
        });

        if (generatedSignature !== razorpay_signature) {
            console.error('Payment signature verification failed:', {
                expected: generatedSignature,
                received: razorpay_signature,
                message: 'Signatures do not match'
            });
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
        // Handle regular order payments
        const { orderId } = body;
        
        // Validate that either orderId or invoiceId is provided
        if (!orderId && !invoiceId) {
            console.error('Order ID or Invoice ID is required in the request body');
            return NextResponse.json(
                { success: false, error: 'Order ID or Invoice ID is required' },
                { status: 400 }
            );
        }

        try {
            if (invoiceId) {
                // Handle room invoice payment
                console.log('Processing room invoice payment for invoice ID:', invoiceId);
                const CreateRoomInvoice = (await import('@/models/CreateRoomInvoice')).default;
                
                // Find the invoice
                const invoice = await CreateRoomInvoice.findById(invoiceId);
                
                if (!invoice) {
                    console.error('Invoice not found with ID:', invoiceId);
                    return NextResponse.json(
                        { success: false, error: 'Invoice not found' },
                        { status: 404 }
                    );
                }

                // Update invoice with payment details
                const updateData = {
                    paymentStatus: 'completed',
                    paymentMode: 'online',
                    paymentDetails: {
                        status: 'completed',
                        transactionId: razorpay_payment_id,
                        orderId: razorpay_order_id,
                        method: paymentDetails.method || 'online',
                        bank: paymentDetails.bank || null,
                        cardType: paymentDetails.card?.type || null,
                        vpa: paymentDetails.vpa || null,
                        wallet: paymentDetails.wallet || null,
                        date: new Date()
                    },
                    paidAmount: paymentDetails.amount ? paymentDetails.amount / 100 : invoice.finalTotal || invoice.totalAmount,
                    dueAmount: 0,
                    updatedAt: new Date()
                };

                console.log('Updating invoice with payment details:', JSON.stringify(updateData, null, 2));
                
                const updatedInvoice = await CreateRoomInvoice.findByIdAndUpdate(
                    invoiceId,
                    updateData,
                    { new: true }
                );

                return NextResponse.json({
                    success: true,
                    message: 'Payment verified and invoice updated successfully',
                    invoice: updatedInvoice
                });
            } else {
                // Handle regular order payment
                console.log('Processing regular order payment for order ID:', orderId);
                const RunningOrder = (await import('@/models/RunningOrder')).default;
                
                // Find the order
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
                    status: 'pending',
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
            }
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