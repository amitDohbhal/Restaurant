import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from "@/models/RoomAccount";
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    // Get the room number from params
    const { roomNumber } = await params;
    
    if (!roomNumber) {
      return NextResponse.json(
        { success: false, message: 'Room number is required' },
        { status: 400 }
      );
    }
    
    // Get the order data from the request body
    const orderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Validate required fields
    if (!orderData.orderId || !orderData.orderNumber || !orderData.items) {
      console.error('Missing required fields in order data');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required order fields',
          receivedData: orderData
        },
        { status: 400 }
      );
    }
    
    // Process items to ensure valid format
    const processedItems = orderData.items.map(item => {
      // Handle different possible ID fields
      const productId = item._id
      const quantity = parseInt(item.quantity || item.qty || 1);
      const price = parseFloat(item.price || 0);
      const total = parseFloat(item.total || (price * quantity));
      
      return {
        ...item,
        productId: productId || null,
        name: item.name || 'Unnamed Item',
        quantity: quantity,
        price: price,
        total: total
      };
    });
    
    // Calculate total amount if not provided
    const totalAmount = orderData.totalAmount || 
      processedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Find the room account by room number
    const roomAccount = await RoomAccount.findOne({ roomNumber });
    
    if (!roomAccount) {
      return NextResponse.json(
        { success: false, message: 'Room account not found' },
        { status: 404 }
      );
    }
    
    try {
      // Create the unpaid order object
      const unpaidOrder = {
        orderId: orderData.orderId.toString(),
        orderNumber: orderData.orderNumber,
        items: processedItems,
        totalAmount: totalAmount,
        customer: orderData.customer || {
          name: 'Guest',
          email: '',
          phone: ''
        },
        status: 'pending',
        orderDate: orderData.orderDate || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Adding unpaid order:', JSON.stringify(unpaidOrder, null, 2));
      
      // Initialize unpaidOrders array if it doesn't exist
      if (!roomAccount.unpaidOrders) {
        roomAccount.unpaidOrders = [];
      }
      
      // Add the unpaid order to the room account
      roomAccount.unpaidOrders.push(unpaidOrder);
      
      // Mark as modified to ensure Mongoose saves the changes
      roomAccount.markModified('unpaidOrders');
      
      // Save the updated room account
      await roomAccount.save();
      
      console.log('Successfully added order to room account');
      
      return NextResponse.json({
        success: true,
        message: 'Order added to room account',
        roomAccount: {
          _id: roomAccount._id,
          roomNumber: roomAccount.roomNumber,
          name: roomAccount.name,
          unpaidOrders: roomAccount.unpaidOrders
        }
      });
      
    } catch (saveError) {
      console.error('Error saving order to room account:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', saveError.errors);
      }
      throw saveError;
    }
    
  } catch (error) {
    console.error('Error adding unpaid order:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error adding unpaid order', 
        error: error.message,
        ...(error.errors && { validationErrors: error.errors })
      },
      { status: 500 }
    );
  }
}
