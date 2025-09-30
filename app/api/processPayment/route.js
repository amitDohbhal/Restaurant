// app/api/processPayment/route.js
import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';

export async function POST(request) {
  const session = await RoomAccount.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { guestId, orderIds = [], roomInvoiceIds = [], paymentMethod = 'cash' } = await request.json();

    // Debug log
    console.log('Payment request received:', { 
      guestId, 
      orderIds,
      roomInvoiceIds,
      orderIdsType: orderIds?.map(id => ({
        value: id,
        type: typeof id
      }))
    });

    if (!guestId || (orderIds.length === 0 && roomInvoiceIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Guest ID and at least one order ID or room invoice ID is required' },
        { status: 400 }
      );
    }

    // Find the guest
    const guest = await RoomAccount.findById(guestId).session(session);
    
    if (!guest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 404 }
      );
    }

    const paidAt = new Date();
    const updateOperations = {
      $set: { updatedAt: paidAt },
      $push: {},
      $pull: {}
    };

    let processedOrders = [];
    let processedInvoices = [];

    // Process orders if any
    if (orderIds.length > 0) {
      const orderIdStrings = orderIds.map(id => id.toString());
      const ordersToProcess = guest.unpaidOrders?.filter(order => 
        orderIdStrings.includes(order.orderId?.toString())
      ) || [];

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

      const paidOrders = ordersToProcess.map(order => ({
        ...order.toObject(),
        paymentMethod,
        paymentStatus: 'paid',
        paidAt
      }));

      updateOperations.$pull.unpaidOrders = { orderId: { $in: orderIdStrings } };
      updateOperations.$push.paidOrders = { $each: paidOrders };
      processedOrders = ordersToProcess.map(o => o.orderId);
    }

    // Process room invoices if any
    if (roomInvoiceIds.length > 0) {
      const invoiceIdStrings = roomInvoiceIds.map(id => id.toString());
      const invoicesToProcess = guest.unpaidRoomInvoices?.filter(invoice => 
        invoiceIdStrings.includes(invoice._id?.toString())
      ) || [];

      if (invoicesToProcess.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'No matching unpaid room invoices found',
            debug: {
              requestedInvoiceIds: invoiceIdStrings,
              availableInvoiceIds: guest.unpaidRoomInvoices?.map(i => i._id?.toString()) || []
            }
          },
          { status: 400 }
        );
      }

      const paidInvoices = invoicesToProcess.map(invoice => ({
        ...invoice.toObject(),
        paymentMethod,
        paymentStatus: 'paid',
        paidAt
      }));

      updateOperations.$pull.unpaidRoomInvoices = { _id: { $in: invoiceIdStrings } };
      updateOperations.$push.paidRoomInvoices = { $each: paidInvoices };
      processedInvoices = invoicesToProcess.map(i => i._id);
    }

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
        processedOrders,
        processedInvoices,
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