import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';

// Process payment for guest's unpaid orders
export async function POST(request) {
  try {
    await connectDB();
    
    const { guestId, paymentMethod, orderIds } = await request.json();
    
    if (!guestId || !orderIds?.length) {
      return NextResponse.json(
        { success: false, message: 'Guest ID and order IDs are required' },
        { status: 400 }
      );
    }
    
    // Start a session for transaction
    const session = await RoomAccount.startSession();
    session.startTransaction();
    
    try {
      // Find the guest with unpaid orders
      const guest = await RoomAccount.findById(guestId).session(session);
      if (!guest) {
        throw new Error('Guest not found');
      }
      
      // Filter the unpaid orders that match the provided orderIds
      const ordersToProcess = guest.unpaidOrders.filter(order => 
        orderIds.includes(order.orderId.toString())
      );
      
      if (ordersToProcess.length === 0) {
        throw new Error('No matching unpaid orders found');
      }
      
      // Update payment status and move to paid orders
      const paidAt = new Date();
      const paidOrders = ordersToProcess.map(order => ({
        ...order.toObject(),
        paymentMethod,
        paymentStatus: 'paid',
        paidAt
      }));
      
      // Update the guest document
      await RoomAccount.findByIdAndUpdate(
        guestId,
        {
          $pull: { unpaidOrders: { orderId: { $in: orderIds } } },
          $push: { paidOrders: { $each: paidOrders } },
          $set: { updatedAt: new Date() }
        },
        { session, new: true }
      );
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          processedOrders: orderIds,
          paymentMethod,
          paidAt
        }
      });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to process payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
