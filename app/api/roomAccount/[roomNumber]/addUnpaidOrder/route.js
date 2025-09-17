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
    if (!orderData.orderNumber || !orderData.items) {
      console.error('Missing required fields in order data');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required order fields (orderNumber and items are required)',
          receivedData: orderData
        },
        { status: 400 }
      );
    }
    
    // Generate an orderId if not provided
    if (!orderData.orderId) {
      orderData.orderId = new mongoose.Types.ObjectId().toString();
    }
    
    // Process items to ensure valid format and include all tax fields
    const processedItems = orderData.items.map(item => {
      // Process items - just parse the values as they are, no calculations
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity || item.qty || 1);
      
      // Get tax percentages (cgst and sgst fields contain the percentages)
      const cgstPercent = parseFloat(item.cgstPercent) || 0;
      const sgstPercent = parseFloat(item.sgstPercent) || 0;
      const cgstAmount = parseFloat(item.cgstAmount) || 0;
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      
      // Calculate item totals
      const itemSubtotal = price * quantity;
      const itemTax = (cgstAmount + sgstAmount) * quantity;
      const itemTotal = itemSubtotal + itemTax;
      
      return {
        ...item,
        productId: item.productId || item._id || null,
        name: item.name || 'Unnamed Item',
        quantity: quantity,
        price: price,
        // Store tax percentages and calculated amounts
        cgstPercent: cgstPercent,           // Tax percentage (e.g., 18 for 18%)
        sgstPercent: sgstPercent,           // Tax percentage (e.g., 18 for 18%)
        cgstAmount: cgstAmount, // Calculated tax amount
        sgstAmount: sgstAmount, // Calculated tax amount
        itemTotal: itemTotal,
        total: itemTotal
      };
    });
    
    // Calculate order totals with proper tax handling
    const subtotal = processedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);
    
    const taxAmount = processedItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 1;
      
      // Calculate tax amounts from percentages if needed
      let cgstAmount = parseFloat(item.cgstAmount) || 0;
      let sgstAmount = parseFloat(item.sgstAmount) || 0;
      
      // If tax amounts are not provided but percentages are, calculate them
      if (!cgstAmount && item.cgstPercent) {
        cgstAmount = (price * parseFloat(item.cgstPercent) / 100);
      }
      if (!sgstAmount && item.sgstPercent) {
        sgstAmount = (price * parseFloat(item.sgstPercent) / 100);
      }
      
      return sum + ((cgstAmount + sgstAmount) * qty);
    }, 0);
    
    const totalAmount = parseFloat(orderData.totalAmount) || (subtotal + taxAmount);
    
    console.log('Calculated totals:', { 
      subtotal, 
      taxAmount, 
      totalAmount,
      itemCount: processedItems.length 
    });
    
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
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        items: processedItems,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        paymentMethod: orderData.paymentMethod || 'pay_at_hotel',
        paymentStatus: 'pending',
        customer: orderData.customer || null,
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

