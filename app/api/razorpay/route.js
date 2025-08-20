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
// Minimal, robust Razorpay POST handler for RoomInvoice and e-commerce
export async function POST(request) {
    try {
      await connectDB();
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      const { amount, currency = 'INR', receipt, notes = {}, customer, products } = requestBody;
      if (amount === undefined || amount === null || !receipt) {
        return NextResponse.json({ error: 'Missing required fields: amount, receipt' }, { status: 400 });
      }
      // Create Razorpay order
      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(Number(amount) ),
          currency: currency.toUpperCase(),
          receipt: receipt.toString(),
          notes: {
            ...notes,
            ...(customer && customer.email ? { customer_email: customer.email } : {})
          }
        });
      } catch (err) {
        return NextResponse.json({ error: 'Failed to create payment order', details: err.message }, { status: 500 });
      }
      if (!razorpayOrder || !razorpayOrder.id) {
        return NextResponse.json({ error: 'Failed to create payment order - no order ID received' }, { status: 500 });
      }
      // If products and customer are present (cart/checkout), save to DB (optional, not needed for RoomInvoice)
      if (Array.isArray(products) && products.length > 0 && customer) {
        // ... Place your e-commerce DB save logic here if needed ...
      }
      // Always return Razorpay order details for RoomInvoice and fallback
      return NextResponse.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
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