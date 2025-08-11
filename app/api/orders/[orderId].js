import { NextResponse } from 'next/server';
import Order from '../../../models/Order';
import connectDB from '@/lib/connectDB';

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { orderId } = params;
    const update = await req.json();
    const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
    if (!order) {
      return NextResponse.json({ error: 'Order not found', success: false }, { status: 404 });
    }
    return NextResponse.json({ order, success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}
