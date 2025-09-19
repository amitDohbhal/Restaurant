import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import RoomAccount from '@/models/RoomAccount';

export async function POST(request) {
  try {
    await connectDB();
    
    const { roomNumber, invoiceData } = await request.json();
    
    if (!roomNumber || !invoiceData) {
      return NextResponse.json(
        { success: false, message: 'Room number and invoice data are required' },
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

    // Prepare the invoice data
    const invoiceToAdd = {
      // Basic invoice info
      invoiceId: invoiceData.invoiceId,
      invoiceNo: invoiceData.invoiceNo || `INV-${Date.now()}`,
      invoiceDate: new Date(invoiceData.invoiceDate || Date.now()),
      
      // Payment details
      totalAmount: invoiceData.totalAmount || 0,
      dueAmount: invoiceData.dueAmount || invoiceData.totalAmount || 0,
      paymentStatus: 'unpaid',
      paymentMode: invoiceData.paymentMode || 'room',
      
      // Room and guest info
      roomNumber: invoiceData.roomNumber || roomNumber,
      roomType: invoiceData.roomType || '',
      guestName: invoiceData.guestName || `${invoiceData.guestFirst || ''} ${invoiceData.guestLast || ''}`.trim(),
      
      // Food items
      foodItems: (invoiceData.foodItems || []).map(item => ({
        name: item.foodName || item.name || '',
        qtyType: item.qtyType || 'full',
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        amount: item.amount || 0,
        cgstPercent: item.cgstPercent || 0,
        cgstAmount: item.cgstAmount || 0,
        sgstPercent: item.sgstPercent || 0,
        sgstAmount: item.sgstAmount || 0,
        taxTotal: item.taxTotal || 0,
        totalAmount: item.totalAmount || 0
      })),    
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the invoice to unpaidRoomInvoices array
    roomAccount.unpaidRoomInvoices.push(invoiceToAdd);
    
    // Mark as modified to ensure proper saving of nested objects
    roomAccount.markModified('unpaidRoomInvoices');
    
    // Save the updated room account
    const updatedAccount = await roomAccount.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Invoice added to room account successfully',
        data: updatedAccount
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating room account with invoice:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update room account with invoice',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
