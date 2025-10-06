import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/connectDB';
import CreateRoomInvoice from '@/models/CreateRoomInvoice';
import CreateRestaurantInvoice from '@/models/CreateRestaurantInvoice';
import RunningOrder from '@/models/RunningOrder';
import RoomAccount from '@/models/RoomAccount';
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
            orderIds = [],
            roomInvoiceIds = []
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
        else if (type === 'restaurant' && invoiceId){
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
        else if (orderId || (orderIds && orderIds.length > 0) || (roomInvoiceIds && roomInvoiceIds.length > 0)) {
            console.log('Processing payment with:', { orderId, orderIds, roomInvoiceIds });
            
            try {
                const results = [];
                const amountPerItem = paymentDetails.amount / 100; // Convert to rupees
                
                // 1. Handle single orderId (search in RunningOrder)
                if (orderId) {
                    const order = await RunningOrder.findById(orderId);
                    if (order) {
                        // Update RunningOrder
                        order.paymentStatus = 'paid';
                        order.paymentDetails = {
                            paymentId: razorpay_payment_id,
                            orderId: razorpay_order_id,
                            method: 'razorpay',
                            status: 'captured',
                            amount: amountPerItem,
                            currency: paymentDetails.currency,
                            timestamp: new Date()
                        };
                        await order.save();
                        
                        // Update RoomAccount if applicable
                        if (order.roomAccountId) {
                            await RoomAccount.findByIdAndUpdate(
                                order.roomAccountId,
                                {
                                    $pull: { unpaidOrders: { orderId: order._id } },
                                    $push: {
                                        paidOrders: {
                                            ...order.toObject(),
                                            paymentStatus: 'paid',
                                            paidAt: new Date(),
                                            paymentMethod: 'online',
                                            razorpayPaymentId,
                                            razorpayOrderId,
                                            razorpaySignature
                                        }
                                    }
                                }
                            );
                        }
                        
                        results.push({ type: 'running_order', order });
                    } else {
                        console.error('RunningOrder not found with ID:', orderId);
                    }
                }
                
                // 2. Handle orderIds array (search in CreateRoomInvoice and CreateRestaurantInvoice)
                if (orderIds && orderIds.length > 0) {
                    const amountPerInvoice = amountPerItem / orderIds.length; // Split amount
                    
                    for (const oid of orderIds) {
                        if (!oid) continue;
                        
                        // Try to find in CreateRoomInvoice first
                        let invoice = await CreateRoomInvoice.findById(oid);
                        let invoiceType = 'room_invoice';
                        
                        // If not found, try CreateRestaurantInvoice
                        if (!invoice) {
                            invoice = await CreateRestaurantInvoice.findById(oid);
                            invoiceType = 'restaurant_invoice';
                        }
                        
                        if (invoice) {
                            const updateData = {
                                paymentStatus: 'completed',
                                paidAmount: amountPerInvoice,
                                dueAmount: 0,
                                razorpayPaymentId,
                                razorpayOrderId: razorpay_order_id || paymentDetails.order_id,
                                razorpaySignature,
                                paymentDate: new Date(),
                                paymentDetails: paymentDetails
                            };
                            
                            const Model = invoiceType === 'room_invoice' ? CreateRoomInvoice : CreateRestaurantInvoice;
                            const updatedInvoice = await Model.findByIdAndUpdate(
                                oid,
                                { $set: updateData },
                                { new: true }
                            );
                            
                            // Update RoomAccount if applicable
                            if (invoice.roomAccountId) {
                                const updateField = invoiceType === 'room_invoice' ? 'unpaidRoomInvoices' : 'unpaidInvoices';
                                const pushField = invoiceType === 'room_invoice' ? 'paidRoomInvoices' : 'paidInvoices';
                                
                                try {
                                    console.log(`Processing ${invoiceType} for RoomAccount ${invoice.roomAccountId}, Invoice ID: ${invoice._id}`);
                                    
                                    // 1. Pull from unpaid array
                                    const pullResult = await RoomAccount.updateOne(
                                        { _id: invoice.roomAccountId, [`${updateField}._id`]: invoice._id },
                                        { 
                                            $pull: { 
                                                [updateField]: { _id: invoice._id } 
                                            } 
                                        }
                                    );
                                    console.log(`Pull result for ${invoice._id}:`, pullResult);

                                    // 2. Add to paid array
                                    const paidInvoice = {
                                        ...updatedInvoice.toObject(),
                                        paymentStatus: 'completed',
                                        paidAt: new Date(),
                                        paymentMethod: 'online',
                                        razorpayPaymentId: razorpay_payment_id,
                                        razorpayOrderId: razorpay_order_id || paymentDetails.order_id,
                                        razorpaySignature: razorpay_signature
                                    };

                                    const pushResult = await RoomAccount.updateOne(
                                        { _id: invoice.roomAccountId },
                                        { 
                                            $addToSet: { [pushField]: paidInvoice },
                                            $inc: { totalPaid: paidInvoice.totalAmount || 0 }
                                        }
                                    );
                                    console.log(`Push result for ${invoice._id}:`, pushResult);
                                    
                                    console.log(`Successfully processed ${invoiceType} ${invoice._id} for RoomAccount ${invoice.roomAccountId}`);
                                    
                                } catch (error) {
                                    console.error(`Error processing ${invoiceType} ${invoice._id}:`, error);
                                    throw error; // Re-throw to be caught by the outer try-catch
                                }
                            }
                            
                            results.push({ type: invoiceType, invoice: updatedInvoice });
                        } else {
                            console.error(`No matching invoice found for ID: ${oid}`);
                        }
                    }
                }
                
                // 3. Handle roomInvoiceIds array (search in CreateRoomInvoice)
                if (roomInvoiceIds && roomInvoiceIds.length > 0) {
                    const amountPerInvoice = amountPerItem / roomInvoiceIds.length; // Split amount
                    
                    for (const invId of roomInvoiceIds) {
                        if (!invId) continue;
                        
                        const invoice = await CreateRoomInvoice.findById(invId);
                        if (invoice) {
                            const updateData = {
                                paymentStatus: 'completed',
                                paidAmount: amountPerInvoice,
                                dueAmount: 0,
                                razorpayPaymentId,
                                razorpayOrderId: razorpay_order_id || paymentDetails.order_id,
                                razorpaySignature,
                                paymentDate: new Date(),
                                paymentDetails: paymentDetails
                            };
                            
                            const updatedInvoice = await CreateRoomInvoice.findByIdAndUpdate(
                                invId,
                                { $set: updateData },
                                { new: true }
                            );
                            
                            // Update RoomAccount for room invoices
                            if (invoice.roomAccountId) {
                                try {
                                    console.log(`Processing room invoice for RoomAccount ${invoice.roomAccountId}, Invoice ID: ${invoice._id}`);
                                    
                                    // 1. First, find the room account with the unpaid invoice
                                    const roomAccount = await RoomAccount.findOne({
                                        _id: invoice.roomAccountId,
                                        'unpaidRoomInvoices._id': invoice._id
                                    });

                                    if (!roomAccount) {
                                        throw new Error('Room account or unpaid invoice not found');
                                    }

                                    // 2. Find the unpaid invoice in the array
                                    const unpaidInvoice = roomAccount.unpaidRoomInvoices.find(
                                        inv => inv._id.toString() === invoice._id.toString()
                                    );

                                    if (!unpaidInvoice) {
                                        throw new Error('Unpaid invoice not found in room account');
                                    }

                                    // 3. Prepare the paid invoice with updated payment info
                                    const paidInvoice = {
                                        ...unpaidInvoice.toObject(),
                                        _id: new mongoose.Types.ObjectId(), // New ID for the paid invoice
                                        invoiceId: unpaidInvoice._id, // Keep reference to original ID
                                        paymentStatus: 'completed',
                                        paymentMode: 'online',
                                        paidAt: new Date(),
                                        transactionId: razorpay_payment_id,
                                        razorpayPaymentId: razorpay_payment_id,
                                        razorpayOrderId: razorpay_order_id || paymentDetails.order_id,
                                        razorpaySignature: razorpay_signature
                                    };

                                    // 4. Perform atomic update to move invoice from unpaid to paid
                                    console.log('Attempting to update RoomAccount with paid invoice:', {
                                        roomAccountId: invoice.roomAccountId,
                                        invoiceId: invoice._id,
                                        amount: unpaidInvoice.totalAmount
                                    });

                                    // First, verify the document exists and has the unpaid invoice
                                    const docExists = await RoomAccount.findOne({
                                        _id: invoice.roomAccountId,
                                        'unpaidRoomInvoices._id': invoice._id
                                    });

                                    if (!docExists) {
                                        throw new Error('Document or unpaid invoice not found before update');
                                    }

                                    // Perform the update in two separate operations to ensure reliability
                                    // 1. Add to paid invoices and update totals
                                    const addToPaid = await RoomAccount.updateOne(
                                        { _id: invoice.roomAccountId },
                                        {
                                            $push: {
                                                paidRoomInvoices: {
                                                    $each: [paidInvoice],
                                                    $position: 0
                                                }
                                            },
                                            $inc: {
                                                totalPaid: unpaidInvoice.totalAmount || 0,
                                                balance: -1 * (unpaidInvoice.totalAmount || 0)
                                            }
                                        }
                                    );

                                    console.log('Add to paid result:', addToPaid);

                                    // 2. Remove from unpaid invoices
                                    const removeFromUnpaid = await RoomAccount.updateOne(
                                        { _id: invoice.roomAccountId },
                                        {
                                            $pull: {
                                                unpaidRoomInvoices: { _id: invoice._id }
                                            }
                                        }
                                    );

                                    console.log('Remove from unpaid result:', removeFromUnpaid);

                                    if (addToPaid.modifiedCount === 0 || removeFromUnpaid.modifiedCount === 0) {
                                        throw new Error(`Failed to update room account. Add Paid: ${addToPaid.modifiedCount}, Remove Unpaid: ${removeFromUnpaid.modifiedCount}`);
                                    }
                                    
                                    console.log(`Successfully processed room invoice ${invoice._id} for RoomAccount ${invoice.roomAccountId}`);
                                    
                                } catch (error) {
                                    console.error(`Error processing room invoice ${invoice._id}:`, error);
                                    throw error; // Re-throw to be caught by the outer try-catch
                                }
                            }
                            
                            results.push({ type: 'room_invoice', invoice: updatedInvoice });
                        } else {
                            console.error(`Room invoice not found with ID: ${invId}`);
                        }
                    }
                }
                
                if (results.length === 0) {
                    return NextResponse.json(
                        { success: false, error: 'No matching orders or invoices found' },
                    );
                }
                
                // Group results by type for the response
                const groupedResults = results.reduce((acc, item) => {
                    if (!acc[item.type]) acc[item.type] = [];
                    acc[item.type].push(item[item.type === 'running_order' ? 'order' : 'invoice']);
                    return acc;
                }, {});
                
                return NextResponse.json({
                    success: true,
                    message: `Successfully processed ${results.length} order(s)/invoice(s)`,
                    results: groupedResults
                });
                
            } catch (error) {
                console.error('Error processing payment:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to process payment', details: error.message },
                    { status: 500 }
                );
            }
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