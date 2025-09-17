import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RunningOrder from '@/models/RunningOrder';
import RoomAccount from '@/models/RoomAccount';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      items, 
      customer = {},
      paymentMethod = 'online',
      orderType = 'takeaway',
      roomNumber: requestRoomNumber,
      tableNumber,
      notes = ''
    } = body;

    // Use roomNumber from customer if available, otherwise from request
    const roomNumber = customer.roomNumber || requestRoomNumber;

    // Validate required fields
    if (!items || !items.length) {
      return NextResponse.json(
        { success: false, message: 'No items in the order' },
        { status: 400 }
      );
    }

    // Process items - just parse the values as they are, no calculations
    let processedItems = items.map(item => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty) || 1;
      
      // Simply parse all tax values as they are
      const cgstPercent = parseFloat(item.cgstPercent) || 0;
      const sgstPercent = parseFloat(item.sgstPercent) || 0;
      const cgstAmount = parseFloat(item.cgstAmount) || 0;
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      
      const itemSubtotal = price * qty;
      const itemTax = (cgstAmount + sgstAmount) * qty;
      const itemTotal = itemSubtotal + itemTax;
      
      return {
        ...item,
        price,
        quantity: qty,
        cgstPercent,
        sgstPercent,
        cgstAmount,
        sgstAmount,
        total: itemTotal
      };
    });
    
    // Calculate order totals with proper type conversion
    const subtotal = processedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);
    
    // Calculate tax amount for each item, considering both amounts and percentages
    processedItems = processedItems.map(item => {
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
      
      // Update the item with calculated tax amounts
      return {
        ...item,
        cgstAmount,
        sgstAmount,
        // Update the total for this item
        total: (price + cgstAmount + sgstAmount) * qty
      };
    });
    
    // Calculate total tax
    const tax = processedItems.reduce((sum, item) => {
      return sum + ((item.cgstAmount + item.sgstAmount) * parseInt(item.quantity));
    }, 0);
    
    const total = subtotal + tax;
    
    console.log('Order totals:', { 
      subtotal, 
      tax, 
      total,
      itemCount: processedItems.length,
      firstItem: processedItems[0] // Log first item for debugging
    });

    // For room-service or room-account payments, verify room number
    if ((orderType === 'room-service' || paymentMethod === 'room-account') && !roomNumber) {
      return NextResponse.json(
        { success: false, message: 'Room number is required for room service orders' },
        { status: 400 }
      );
    }

    // For room-account payments, verify guest is checked in to the room
    if (paymentMethod === 'room-account' || orderType === 'room-service') {
      if (!customer._id) {
        return NextResponse.json(
          { success: false, message: 'Guest ID is required for room account payment' },
          { status: 400 }
        );
      }
      
      // Find the guest and verify they are checked in
      const guest = await RoomAccount.findOne({ 
        $or: [
          { _id: customer._id },
          { guestId: customer._id }
        ],
        status: 'checked-in',
        roomNumber: roomNumber || customer.roomNumber
      });
      
      if (!guest) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Guest not found or not checked in to the specified room. Please check in first.' 
          },
          { status: 400 }
        );
      }
      
      // Update customer data with guest information
      customer._id = guest._id;
      customer.guestId = guest.guestId || guest._id;
      customer.roomNumber = guest.roomNumber;
      customer.roomType = guest.roomType;
    }

    // Create order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Log incoming customer data for debugging
    console.log('Creating order with customer data:', {
      customerId: customer._id,
      guestId: customer.guestId,
      roomNumber,
      customer
    });

    // Validate userId is present
    if (!customer.userId) {
      console.error('No userId provided in customer data');
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create the order with guest and room information
    const orderData = {
      orderNumber,
      // Include user ID
      userId: customer.userId,
      customer: {
        _id: customer._id || null,
        guestId: customer.guestId || customer._id || null,
        name: customer.name || 'Guest',
        phone: customer.phone || '',
        email: customer.email || '',
        roomNumber: roomNumber || null,
        roomId: customer.roomId || null,
        checkIn: customer.checkIn || null,
        checkOut: customer.checkOut || null,
        userId: customer.userId
      },
      items: processedItems.map(item => ({
        productId: item.id || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        cgstAmount: item.cgstAmount || 0,
        sgstAmount: item.sgstAmount || 0,
        cgstPercent: item.cgstPercent || 0,
        sgstPercent: item.sgstPercent || 0,
        total: item.total,
        notes: item.notes
      })),
      // Customer information
      customer: {
        // User identification (required)
        userId: customer.userId,
        // Guest identification
        _id: customer._id || null,
        guestId: customer.guestId || customer._id || null,
        
        // Contact information
        name: customer.name || 'Guest Customer',
        phone: customer.phone || '0000000000',
        email: customer.email || 'guest@example.com',
        
        // Room information
        ...(roomNumber && { roomNumber }),
        ...(customer.roomId && { roomId: customer.roomId }),
        ...(customer.checkIn && { checkIn: customer.checkIn }),
        ...(customer.checkOut && { checkOut: customer.checkOut })
      },
      // Keep guestInfo for backward compatibility
      guestInfo: {
        // Guest identification
        _id: customer._id || null,
        guestId: customer.guestId || customer._id || null,
        
        // Contact information
        name: customer.name || 'Guest Customer',
        phone: customer.phone || '0000000000',
        email: customer.email || 'guest@example.com',
        
        // Room information
        ...(roomNumber && { roomNumber }),
        ...(customer.roomId && { roomId: customer.roomId }),
        ...(customer.checkIn && { checkIn: customer.checkIn }),
        ...(customer.checkOut && { checkOut: customer.checkOut })
      },
      // Add room number at the root level if it's a room account or room service
      ...((paymentMethod === 'room-account' || orderType === 'room-service' || roomNumber) ? { 
        roomNumber: roomNumber || customer.roomNumber 
      } : {}),
      subtotal,
      tax,
      total,
      paymentMethod,
      orderType,
      // Add room number at the root level if it's a room account or room service
      ...(paymentMethod === 'room-account' || orderType === 'room-service' ? { roomNumber } : {}),
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      notes,
      status: 'pending',
      paymentStatus: paymentMethod === 'online' ? 'pending' : paymentMethod === 'pay_later' ? 'pending' : 'pending'
    };

    // Create a new RunningOrder instance
    const order = new RunningOrder(orderData);
    await order.save();

    // Find the room account using roomNumber from the order or customer data
    const roomNumberToUse = roomNumber || (order.customer && order.customer.roomNumber);
    
    if (roomNumberToUse) {
      try {
        // Determine if this is a paid or unpaid order
        const isPaidOrder = ['online', 'cash', 'card'].includes(paymentMethod);
        
        // Prepare order item for room account
        const orderItem = {
          orderId: order._id,
          orderNumber: order.orderNumber,
          items: order.items.map(item => ({
            productId: item.productId?.toString() || item._id?.toString(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            cgstAmount: item.cgstAmount || 0,
            sgstAmount: item.sgstAmount || 0,
            cgstPercent: item.cgstPercent || 0,
            sgstPercent: item.sgstPercent || 0
          })),
          totalAmount: order.total,
          paymentMethod: paymentMethod,
          paymentStatus: isPaidOrder ? 'paid' : 'pending',
          status: 'pending',
          orderDate: new Date(),
          createdAt: new Date(),
          // Include customer information for reference
          customer: {
            name: order.customer?.name,
            email: order.customer?.email,
            phone: order.customer?.phone,
            roomNumber: order.customer?.roomNumber,
            ...(order.customer?._id && { _id: order.customer._id })
          }
        };

        // Add paidAt timestamp for paid orders
        if (isPaidOrder) {
          orderItem.paidAt = new Date();
        }

        // Prepare update operation
        const updateOperation = {
          $push: {},
          $set: { updatedAt: new Date() }
        };

        // Always add to the appropriate list based on payment status
        const targetList = isPaidOrder ? 'paidOrders' : 'unpaidOrders';
        updateOperation.$push[targetList] = orderItem;

        // If this is a pay-at-hotel order, also add to unpaidOrders
        if (paymentMethod === 'pay_at_hotel') {
          const unpaidOrderItem = { ...orderItem };
          unpaidOrderItem.paymentStatus = 'pending';
          unpaidOrderItem.status = 'pending';
          updateOperation.$push.unpaidOrders = unpaidOrderItem;
        }
        // If this is an online payment, also add to paidOrders
        else if (isPaidOrder) {
          updateOperation.$push.paidOrders = orderItem;
        }

        // Update the room account in one atomic operation
        const result = await RoomAccount.findOneAndUpdate(
          { roomNumber: roomNumberToUse },
          updateOperation,
          { new: true, upsert: false }
        );

        if (result) {
          console.log(`Order ${order.orderNumber} added to room ${roomNumberToUse}'s ${isPaidOrder ? 'paidOrders' : 'unpaidOrders'}`);
          if (paymentMethod === 'pay_at_hotel') {
            console.log(`Order ${order.orderNumber} also added to unpaidOrders for tracking`);
          }
        } else {
          console.warn(`Room ${roomNumberToUse} not found, could not link order`);
        }
      } catch (error) {
        console.error('Error linking paid order to room account:', error);
        // Don't fail the request if room account update fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    console.log('PATCH /api/runningOrder - Connecting to DB...');
    await connectDB();
    
    const requestData = await request.json();
    console.log('PATCH /api/runningOrder - Request data:', JSON.stringify(requestData, null, 2));
    
    const { orderId, status } = requestData;

    if (!orderId || !status) {
      console.error('PATCH /api/runningOrder - Missing required fields:', { orderId, status });
      return NextResponse.json(
        { success: false, message: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.error('PATCH /api/runningOrder - Invalid status value:', status);
      return NextResponse.json(
        { success: false, message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`PATCH /api/runningOrder - Updating order ${orderId} to status: ${status}`);
    
    const updateData = { 
      status,
      updatedAt: new Date(),
      ...(status === 'completed' && { completedAt: new Date() }),
      ...(status === 'cancelled' && { cancelledAt: new Date() })
    };
    
    console.log('PATCH /api/runningOrder - Update data:', JSON.stringify(updateData, null, 2));

    const updatedOrder = await RunningOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`PATCH /api/runningOrder - Order not found with ID: ${orderId}`);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`PATCH /api/runningOrder - Successfully updated order ${orderId}`);
    return NextResponse.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    console.error('PATCH /api/runningOrder - Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const roomNumber = searchParams.get('roomNumber');
    const orderNumber = searchParams.get('orderNumber');
    
    // If orderNumber is provided, fetch a single order
    if (orderNumber) {
      const order = await RunningOrder.findOne({ orderNumber });
      
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(order);
    }
    
    // Otherwise, fetch multiple orders with filters
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (roomNumber) {
      query['customer.roomNumber'] = roomNumber;
    }
    
    const orders = await RunningOrder.find(query)
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch orders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}