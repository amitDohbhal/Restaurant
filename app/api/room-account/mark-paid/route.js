import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import RoomAccount from '@/models/RoomAccount';

export async function POST(request) {
  try {
    await connectDB();
    
    const { roomNumber, invoiceId, paymentMode } = await request.json();
    
    if (!roomNumber || !invoiceId || !paymentMode) {
      return NextResponse.json(
        { success: false, message: 'Room number, invoice ID, and payment mode are required' },
        { status: 400 }
      );
    }

    // Find the room account by room number and ensure the guest is checked in
    const roomAccount = await RoomAccount.findOne({
      roomNumber,
      status: 'checked-in'
    });

    if (!roomAccount) {
      return NextResponse.json(
        { success: false, message: 'No active room account found with the provided room number' },
        { status: 404 }
      );
    }

    // Find the invoice in unpaidRoomInvoices
    const invoiceIndex = roomAccount.unpaidRoomInvoices.findIndex(
      inv => inv.invoiceId.toString() === invoiceId.toString()
    );

    if (invoiceIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found in the room account' },
        { status: 404 }
      );
    }

    // Get the invoice and remove it from unpaid
    const [paidInvoice] = roomAccount.unpaidRoomInvoices.splice(invoiceIndex, 1);
    
    // Update payment status and mode
    paidInvoice.paymentStatus = 'paid';
    paidInvoice.paymentMode = paymentMode;
    paidInvoice.paidAt = new Date();
    paidInvoice.updatedAt = new Date();

    // Add to paidRoomInvoices
    roomAccount.paidRoomInvoices = roomAccount.paidRoomInvoices || [];
    roomAccount.paidRoomInvoices.push(paidInvoice);
    
    // Mark as modified to ensure proper saving of nested objects
    roomAccount.markModified('unpaidRoomInvoices');
    roomAccount.markModified('paidRoomInvoices');
    
    // Save the updated room account
    await roomAccount.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Invoice marked as paid successfully',
        data: roomAccount
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to mark invoice as paid',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
