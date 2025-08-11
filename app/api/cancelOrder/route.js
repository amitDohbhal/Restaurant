// app/api/cancelOrder/route.js
import connectDB  from '@/lib/connectDB';
import CancelOrder from '@/models/CancelOrder';
import Order from '@/models/Order';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    const statusUpdate = {
      status: "Cancellation Requested",
      timestamp: new Date(),
      message: "User requested order cancellation"
    };
    

    
    if (!data.orderId) {
      console.error('No orderId provided in request');
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    const order = await Order.findById(data.orderId)
      .populate('products.productId')
      .lean();
      
    // console.log('Found order:', order ? 'Order found' : 'Order not found');
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    // Create new cancellation request with schema matching the model
    const cancelRequest = new CancelOrder({
      orderId: data.orderId,
      userId: order.userId || null,
      order: {
        items: data.products.map(product => ({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: product.qty,
          image: product.image,
          size: product.size,
          color: product.color
        })),
        totalAmount: order.totalAmount || order.cartTotal,
        shippingAddress: {
          name: data.userDetails?.name || '',
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          pincode: order.shippingAddress?.pincode || '',
          phone: data.userDetails?.contactNumber || ''
        },
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'online',
        orderDate: order.createdAt || new Date()
      },
      products: data.products.map(p => ({
        productId: p._id,
        quantity: p.qty,
        price: p.price
      })),
      reason: data.reason,
      bankDetails: data.bankDetails,
      userDetails: data.userDetails,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Cancellation request submitted',
        changedAt: new Date()
      }]
    });
    
    // console.log('Creating cancellation request:', JSON.stringify(cancelRequest, null, 2));
    
    await cancelRequest.save();
    
    return NextResponse.json({ 
      success: true, 
      data: cancelRequest 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const requests = await CancelOrder.find()
      .populate('userId', 'name email')
      .populate('products.productId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const { id, status, adminNotes } = await req.json();
    
    const request = await CancelOrder.findById(id);
    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Update request status
    request.status = status;
    request.adminNotes = adminNotes;
    request.statusHistory.push({
      status,
      note: adminNotes || `Status changed to ${status}`
    });

    // If approved, update the order status
    if (status === 'approved') {
      await Order.findByIdAndUpdate(request.orderId, {
        status: 'cancelled',
        $push: {
          statusHistory: {
            status: 'cancelled',
            note: 'Order cancelled by admin'
          }
        }
      });
    }

    await request.save();
    
    return NextResponse.json({ 
      success: true, 
      data: request 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}