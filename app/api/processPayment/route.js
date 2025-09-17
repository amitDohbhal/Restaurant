// app/api/processPayment/route.js
import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';

export async function POST(request) {
  const session = await RoomAccount.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { guestId, orderIds, paymentMethod = 'cash' } = await request.json();

    // Debug log
    console.log('Payment request received:', { 
      guestId, 
      orderIds, 
      orderIdsType: orderIds?.map(id => ({
        value: id,
        type: typeof id
      }))
    });

    if (!guestId || !orderIds?.length) {
      return NextResponse.json(
        { success: false, message: 'Guest ID and order IDs are required' },
        { status: 400 }
      );
    }

    // Find the guest with unpaid orders
    const guest = await RoomAccount.findById(guestId).session(session);
    
    if (!guest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Debug log
    console.log('Found guest unpaid orders:', {
      guestId: guest._id,
      unpaidOrders: guest.unpaidOrders?.map(order => ({
        orderId: order.orderId,
        orderIdType: typeof order.orderId,
        order
      }))
    });

    // Convert all IDs to strings for consistent comparison
    const orderIdStrings = orderIds.map(id => id.toString());
    
    // Find orders that match the provided IDs
    const ordersToProcess = guest.unpaidOrders?.filter(order => 
      orderIdStrings.includes(order.orderId?.toString())
    ) || [];

    console.log('Matching orders found:', {
      requestedOrderIds: orderIdStrings,
      foundOrderIds: ordersToProcess.map(o => o.orderId),
      matchCount: ordersToProcess.length
    });

    if (ordersToProcess.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No matching unpaid orders found',
          debug: {
            requestedOrderIds: orderIdStrings,
            availableOrderIds: guest.unpaidOrders?.map(o => o.orderId) || []
          }
        },
        { status: 400 }
      );
    }
    
    // Update payment status and move to paid orders
    const paidAt = new Date();
    const paidOrders = ordersToProcess.map(order => ({
      ...order.toObject(),
      paymentMethod,
      paymentStatus: 'paid',
      paidAt
    }));

    // Create update operations
    const updateOperations = {
      $pull: { 
        unpaidOrders: { 
          orderId: { $in: orderIdStrings } 
        } 
      },
      $push: { 
        paidOrders: { $each: paidOrders } 
      },
      $set: { 
        updatedAt: paidAt 
      }
    };

    console.log('Update operations:', JSON.stringify(updateOperations, null, 2));

    // Update the guest document
    const result = await RoomAccount.findByIdAndUpdate(
      guestId,
      updateOperations,
      { session, new: true }
    );

    console.log('Update result:', {
      matchedCount: result?.modifiedCount,
      isSuccess: !!result
    });

    await session.commitTransaction();
    session.endSession();
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        processedOrders: ordersToProcess.map(o => o.orderId),
        paymentMethod,
        paidAt
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Payment processing error:', {
      message: error.message,
      stack: error.stack,
      ...(error.response?.data && { responseData: error.response.data })
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to process payment',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          stack: error.stack 
        })
      },
      { status: 500 }
    );
  }
}