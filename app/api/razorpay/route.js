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

        const { amount, currency = 'INR', receipt, notes = {}, customer, products } = requestBody;
        
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

            // If products and customer are present (cart/checkout), save to DB (optional, not needed for RoomInvoice)
            if (Array.isArray(products) && products.length > 0 && customer) {
                // ... Place your e-commerce DB save logic here if needed ...
            }

            return NextResponse.json({
                success: true,
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            });

        } catch (error) {
            console.error('Razorpay order creation failed:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.statusCode
            });
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

        // Handle room invoice payments
        if (type === 'room' && invoiceId) {
            try {
                // Import the RoomInvoice model dynamically to avoid circular dependencies
                const RoomInvoice = (await import('@/models/CreateRoomInvoice')).default;
                const invoice = await RoomInvoice.findById(invoiceId);
                
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

        // Find and update the order
        const order = await Order.findOne({
            $or: [
                { orderId: razorpay_order_id },
                { razorpayOrderId: razorpay_order_id }
            ]
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found. Please contact support with order ID: " + razorpay_order_id },
                { status: 404 }
            );
        }

        // Update order status and payment details
        order.transactionId = razorpay_payment_id;
        order.status = "Paid";
        order.paymentMethod = "online";
        order.datePurchased = new Date();

        // Update products if cart data is provided
        if (body.cart && Array.isArray(body.cart)) {
            try {
                order.products = body.cart.map(item => {
                    // Handle image field - extract URL if it's an object
                    let imageUrl = item.image;
                    if (item.image && typeof item.image === 'object') {
                        imageUrl = item.image.url || '';
                    }

                    // Calculate pricing fields with proper fallbacks
                    const price = Number(item.price) || 0;
                    const originalPrice = Number(item.originalPrice) || price;
                    const discountAmount = Number(item.discountAmount) || (originalPrice - price);
                    const afterDiscount = price;

                    // Calculate discount percentage if not provided
                    let discountPercent = Number(item.discountPercent) || 0;
                    if (!discountPercent && originalPrice > 0) {
                        discountPercent = Math.round((discountAmount / originalPrice) * 100);
                    }

                    return {
                        _id: item._id || item.productId || item.id,
                        productId: item.productId || item._id || item.id,
                        id: item.id || item._id?.toString(),
                        name: item.name || 'Unnamed Product',
                        price: price,
                        originalPrice: originalPrice,
                        afterDiscount: afterDiscount,
                        qty: item.qty || item.quantity || 1,
                        image: imageUrl,
                        color: item.color || '',
                        size: item.size || '',
                        productCode: item.productCode || '',
                        weight: Number(item.weight) || 0,
                        totalQuantity: Number(item.totalQuantity) || 0,
                        cgst: Number(item.cgst) || 0,
                        sgst: Number(item.sgst) || 0,
                        discountAmount: discountAmount,
                        discountPercent: discountPercent,
                        couponApplied: Boolean(item.couponApplied),
                        couponCode: item.couponCode || ''
                    };
                });
                // console.log('Products updated successfully');
            } catch (cartError) {
                // console.error('Error updating products:', cartError);
                // Continue with the order update even if product update fails
            }
        }

        // Update checkout summary if available
        if (checkoutData) {
            // console.log('Updating checkout summary');
            // Use taxTotal if available, otherwise use totalTax
            const taxTotal = Number(checkoutData.taxTotal) || Number(checkoutData.totalTax) || 0;
            // Use finalShipping if available, otherwise use shippingCost or shipping
            const shippingCost = Number(checkoutData.finalShipping) ||
                Number(checkoutData.shippingCost) ||
                Number(checkoutData.shipping) || 0;

            order.cartTotal = Number(checkoutData.cartTotal) || 0;
            order.subTotal = Number(checkoutData.subTotal) || 0;
            order.totalDiscount = Number(checkoutData.totalDiscount) || 0;
            order.totalTax = taxTotal;
            order.shippingCost = shippingCost;
            order.promoCode = checkoutData.promoCode || '';
            order.promoDiscount = Number(checkoutData.promoDiscount) || 0;


        }

        // Update customer details if form fields are provided
        if (formFields) {
            // console.log('Updating customer details');
            const firstName = formFields.firstName || formFields.fullName?.split(' ')[0] || order.firstName || '';
            const lastName = formFields.lastName || formFields.fullName?.split(' ').slice(1).join(' ') || order.lastName || '';
            const street = formFields.street || order.street || '';
            const city = formFields.city || order.city || '';
            const district = formFields.district || order.district || '';
            const state = formFields.state || order.state || '';
            const pincode = formFields.pincode || order.pincode || '';

            // Update fields
            order.firstName = firstName;
            order.lastName = lastName;
            order.email = formFields.email || order.email || '';
            order.phone = formFields.mobile || formFields.phone || order.phone || '';
            order.altPhone = formFields.altPhone || order.altPhone || '';
            order.street = street;
            order.city = city;
            order.district = district;
            order.state = state;
            order.pincode = pincode;

            // Build address string ensuring district is included
            order.address = formFields.address ||
                [street, city, district, state, pincode]
                    .filter(Boolean)
                    .join(', ');


        }

        // Update user ID if available
        if (user && user._id) {

            order.userId = user._id;
        }

        try {
            await order.save();

        } catch (orderSaveError) {

            return NextResponse.json(
                { success: false, error: "Failed to update order" },
                { status: 500 }
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
        if (paymentResponse.ok) {
            order.bank = paymentDetails.bank || null;
            order.cardType = paymentDetails.card?.type || null;
        }
        // Always set email for online orders (on update)
        if (user && user.email) {
            order.email = user.email;
        } else if (formFields && formFields.email) {
            order.email = formFields.email;
        } // else leave as-is if already present
        order.agree = true; // Always set agree true for online orders (on update)
        await order.save();

        // Update quantities after successful payment
        try {
            const products = cart || order.products || [];
            const itemsToUpdate = products.map(item => ({
                productId: item.productId || item._id,
                variantId: item.variantId || 0, // Default to 0 if no variantId
                quantity: item.quantity || 1
            })).filter(item => item.productId && item.quantity > 0);

            if (itemsToUpdate.length > 0) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                const response = await fetch(`${baseUrl}/api/product/updateQuantities`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ items: itemsToUpdate })
                });

                if (!response.ok) {

                }
            }
        } catch (error) {

            // Don't fail the payment flow if quantity update fails
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