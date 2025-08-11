import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/models/Order"; // Import your Order model
import connectDB from "@/lib/connectDB";
import User from "@/models/User";

// Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials are not properly configured');
}
function generateOrderId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${result}`;
}
function generateTransactionId() {
    return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
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

// Helper function to validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// 📌 Create a Razorpay Order
export async function POST(request) {
    try {
        // Connect to database first
        await connectDB();

        // Parse and validate request body
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            console.error('Failed to parse request body:', e);
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { amount, currency = 'INR', receipt, products, customer } = requestBody;

        // Basic validation
        const missingFields = [];
        if (amount === undefined || amount === null) missingFields.push('amount');
        if (!receipt) missingFields.push('receipt');
        if (!products) missingFields.push('products');
        if (!customer) missingFields.push('customer');

        if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            console.error('Validation error:', errorMsg);
            return NextResponse.json(
                { error: errorMsg },
                { status: 400 }
            );
        }

        // Validate products array
        if (!Array.isArray(products) || products.length === 0) {
            console.error('Validation error: Products array is empty');
            return NextResponse.json(
                { error: 'At least one product is required' },
                { status: 400 }
            );
        }

        // Validate customer data
        if (!customer.email || !isValidEmail(customer.email)) {
            console.error('Validation error: Invalid or missing customer email');
            return NextResponse.json(
                { error: 'A valid email address is required' },
                { status: 400 }
            );
        }

       

        // Create Razorpay order
        let razorpayOrder;
        try {
            // console.log('Creating Razorpay order with amount:', Math.round(Number(amount) * 100));
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(Number(amount) * 100), // Convert to paise and ensure integer
                currency: currency.toUpperCase(),
                receipt: receipt.toString(),
                notes: {
                    source: 'Rishikesh HandMade',
                    customer_email: customer.email
                }
            });
      
        } catch (razorpayError) {
           
            return NextResponse.json(
                {
                    error: 'Failed to create payment order',
                    details: process.env.NODE_ENV === 'development' ? razorpayError.message : undefined
                },
                { status: 500 }
            );
        }

        if (!razorpayOrder || !razorpayOrder.id) {
            // console.error('Razorpay order creation failed - no order ID returned:', razorpayOrder);
            return NextResponse.json(
                { error: 'Failed to create payment order - no order ID received' },
                { status: 500 }
            );
        }

        // Save the order in the database
        let dbOrder;
        try {
            // First validate all products
            const validatedProducts = products.map((item, index) => {
                const productId = item.productId || item._id;
                if (!productId) {
                    throw new Error(`Product at index ${index} is missing an ID`);
                }

                const price = Number(item.price) || 0;
                const qty = Number(item.qty || item.quantity || 1);

                if (isNaN(price) || price < 0) {
                    throw new Error(`Invalid price for product ${productId}: ${item.price}`);
                }
                if (isNaN(qty) || qty < 1) {
                    throw new Error(`Invalid quantity for product ${productId}: ${item.qty}`);
                }

                return {
                    _id: productId,
                    productId: productId,
                    id: productId.toString(),
                    name: String(item.name || 'Unnamed Product').substring(0, 100),
                    price: price,
                    originalPrice: Number(item.originalPrice) || price,
                    afterDiscount: Number(item.afterDiscount) || price,
                    qty: qty,
                    image: String(item.image || '/default-product.png').substring(0, 500),
                    color: String(item.color || '').substring(0, 50),
                    size: String(item.size || '').substring(0, 20),
                    productCode: String(item.productCode || '').substring(0, 50),
                    weight: Math.max(0, Number(item.weight) || 0),
                    totalQuantity: Math.max(0, Number(item.totalQuantity) || 0),
                    cgst: Math.max(0, Number(item.cgst) || 0),
                    sgst: Math.max(0, Number(item.sgst) || 0),
                    discountAmount: Math.max(0, Number(item.discountAmount) || 0),
                    discountPercent: Math.min(100, Math.max(0, Number(item.discountPercent) || 0)),
                    couponApplied: Boolean(item.couponApplied),
                    couponCode: String(item.couponCode || '').substring(0, 20)
                };
            });

            // Prepare order data with validation
            const orderData = {
                products: validatedProducts,
                // Checkout summary fields
                cartTotal: Math.max(0, Number(amount) || 0),
                subTotal: Math.max(0, Number(amount) || 0),
                totalDiscount: Math.max(0, Number(amount) - validatedProducts.reduce((sum, p) => sum + (p.price * p.qty), 0)),
                totalTax: 0, // Will be calculated based on CGST/SGST
                shippingCost: 0,
                // Billing/shipping info
                firstName: String(customer?.name?.split(' ')[0] || 'Guest').substring(0, 50),
                lastName: String(customer?.name?.split(' ').slice(1).join(' ') || 'User').substring(0, 50),
                email: customer?.email || '',
                phone: String(customer?.phone || '').substring(0, 20),
                altPhone: String(customer?.altPhone || '').substring(0, 20),
                street: String(customer?.street || '').substring(0, 200),
                city: String(customer?.city || '').substring(0, 50),
                state: String(customer?.state || '').substring(0, 50),
                pincode: String(customer?.pincode || '').substring(0, 20),
                address: String(customer?.address || '').substring(0, 500),
                // Payment/order info
                orderId: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                razorpayOrderId: razorpayOrder.id,
                transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                payment: 'online',
                status: 'Pending',
                paymentMethod: 'razorpay',
                agree: true,
                datePurchased: new Date(),
                // Calculate total tax from products
                totalTax: validatedProducts.reduce((sum, p) => sum + (p.cgst || 0) + (p.sgst || 0), 0),
                // Checkout summary fields
                cartTotal: Number(amount) || 0,
                subTotal: Number(amount) || 0,
                totalDiscount: 0,
                totalTax: 0,
                shippingCost: 0,
                // Billing/shipping info
                firstName: customer?.name?.split(' ')[0] || 'Guest',
                lastName: customer?.name?.split(' ').slice(1).join(' ') || 'User',
                email: customer?.email || '',
                phone: customer?.phone || '',
                altPhone: customer?.altPhone || '',
                street: customer?.street || '',
                city: customer?.city || '',
                state: customer?.state || '',
                pincode: customer?.pincode || '',
                address: customer?.address || '',
                // Payment/order info
                orderId: generateOrderId(),
                razorpayOrderId: razorpayOrder.id,
                transactionId: generateTransactionId(),
                payment: 'online',
                status: 'Pending',
                paymentMethod: 'razorpay',
                agree: true,
                datePurchased: new Date()
            };

            // Validate required fields
            if (!orderData.email) {
                throw new Error('Customer email is required');
            }
            if (!orderData.products || orderData.products.length === 0) {
                throw new Error('At least one product is required');
            }

         

            // Save to database
            dbOrder = await Order.create(orderData);

        } catch (dbErr) {
            
            return NextResponse.json({
                error: 'Failed to save order in DB',
                details: process.env.NODE_ENV === 'development' ? dbErr.message : undefined
            }, { status: 500 });
        }

        // Respond with both Razorpay order ID and DB order ID
        return NextResponse.json({
            id: razorpayOrder.id, // Razorpay order ID for payment modal
            orderId: dbOrder._id, // MongoDB order ID for tracking
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        // console.error("Error creating Razorpay order:", error);
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
        // console.log('Starting payment verification...');
        const body = await request.json();
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, cart, checkoutData, formFields, user } = body;




        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        // console.log('Signature verification completed');

        if (generatedSignature !== razorpay_signature) {
          
            return NextResponse.json(
                { success: false, error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Step 2: Find and update the order
     
        const order = await Order.findOne({
            $or: [
                { orderId: razorpay_order_id },
                { razorpayOrderId: razorpay_order_id }
            ]
        });

        if (!order) {
            // console.error('Order not found for orderId/razorpayOrderId:', razorpay_order_id);
            return NextResponse.json(
                { success: false, error: "Order not found. Please contact support with order ID: " + razorpay_order_id },
                { status: 404 }
            );
        }

        // console.log('Found order:', order._id);

        // Update order status and payment details
        order.transactionId = razorpay_payment_id;
        order.status = "Paid";
        order.paymentMethod = "online";
        order.datePurchased = new Date();

        // Update products if cart data is provided
        if (cart && Array.isArray(cart)) {
            // console.log('Updating products from cart:', cart.length, 'items');
            try {
                order.products = cart.map(item => {
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