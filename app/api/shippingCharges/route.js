import { NextResponse } from 'next/server';
import ShippingCharge from '../../../models/ShippingCharges';
import connectDB from '@/lib/connectDB';

export async function GET(request) {
  await connectDB();
  try {
    const shippingCharges = await ShippingCharge.find().sort({ createdAt: -1 });
    return NextResponse.json(shippingCharges, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching shipping charges:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping charges' }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  await connectDB();
  try {
    const data = await request.json();
    const { charges } = data;
    if (!charges) {
      return NextResponse.json({ error: 'Missing required fields' }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Remove old data for this pincode
    await ShippingCharge.deleteMany({ charges });
    // Save new
    const newCharge = await ShippingCharge.create({ charges });
    return NextResponse.json(newCharge, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving shipping charges:', error);
    return NextResponse.json({ error: 'Failed to save shipping charges' }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, charges  } = data;
    if (!_id) {
      return NextResponse.json({ error: 'ID is required for update' }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const updatedCharge = await ShippingCharge.findByIdAndUpdate(_id, { charges}, { new: true });
    if (!updatedCharge) {
      return NextResponse.json({ error: 'Shipping charge not found' }, {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return NextResponse.json(updatedCharge, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating shipping charges:', error);
    return NextResponse.json({ error: 'Failed to update shipping charges' }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
