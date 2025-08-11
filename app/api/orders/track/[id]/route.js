import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Order from '@/models/Order';

export async function GET(request, { params }) {
  // console.log('Track Order API called with params:', params);
  
  try {
    await connectDB();
    // console.log('Connected to database');
    
    const { id } = params;
    
    if (!id) {
      // console.error('No order ID provided');
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // console.log('Searching for order with ID:', id);
    
    let order;
    let searchMethod = '';
    
    // Try to find by orderId (Razorpay order ID or custom order ID)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // If it looks like a MongoDB ID
      order = await Order.findById(id);
      searchMethod = 'findById';
    } else {
      // Try to find by orderId field first
      order = await Order.findOne({ orderId: id });
      searchMethod = 'findOne by orderId';
      
      // If not found, try by razorpayOrderId
      if (!order) {
        order = await Order.findOne({ razorpayOrderId: id });
        searchMethod = 'findOne by razorpayOrderId';
      }
      
      // If still not found, try searching in statusHistory.trackingNumber
      if (!order) {
        order = await Order.findOne({ 
          'statusHistory.trackingNumber': id 
        });
        searchMethod = 'findOne by trackingNumber in statusHistory';
      }
    }

    // console.log(`Search method used: ${searchMethod}`);
    
    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order not found. Please check your order ID and try again.',
          searchedId: id,
          searchMethod
        },
        { status: 404 }
      );
    }
   
    // Get the most recent status (sorted by updatedAt)
    const sortedHistory = Array.isArray(order.statusHistory) 
      ? [...order.statusHistory].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      : [];

    const latestStatus = sortedHistory[0] || {};
    
    // Find shipped status with tracking info
    const shippedStatus = sortedHistory.find(s => s.status === 'Shipped' && s.trackingNumber) || {};
    
    // Prepare response data
    const responseData = {
      orderId: order.orderId,
      status: order.status,
      // Use tracking info from shipped status if available, otherwise from latest status
      trackingNumber: shippedStatus.trackingNumber || latestStatus.trackingNumber || null,
      trackingUrl: shippedStatus.trackingUrl || latestStatus.trackingUrl || null,
      customerName: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Customer',
      statusHistory: sortedHistory,
      orderDate: order.createdAt,
      items: order.products || [],
      totalAmount: order.totalAmount || order.cartTotal,
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.payment || 'unknown',
      shippingAddress: {
        name: `${order.firstName || ''} ${order.lastName || ''}`.trim(),
        street: order.street || order.address || '',
        city: order.city || '',
        state: order.state || '',
        pincode: order.pincode || '',
        phone: order.phone || ''
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });    
  } catch (error) {
    console.error('Error in track order API:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process your request. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
