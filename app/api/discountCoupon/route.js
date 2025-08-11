import connectDB from '@/lib/connectDB';
import Discount from '@/models/Discount';

export async function GET(req) {
  await connectDB();
  try {
    const discounts = await Discount.find();
    // Ensure all coupons have startDate and endDate
    const normalized = discounts.map(coupon => ({
      ...coupon.toObject(),
      startDate: coupon.startDate || null,
      endDate: coupon.endDate || null
    }));
    return Response.json(normalized);
  } catch (err) {
    return Response.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const discount = await Discount.create(body);
    return Response.json(discount, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req) {
  await connectDB();
  try {
    const { id, status } = await req.json();
    const discount = await Discount.findByIdAndUpdate(id, { status }, { new: true });
    if (!discount) return Response.json({ error: 'Discount not found' }, { status: 404 });
    return Response.json(discount);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  await connectDB();
  try {
    const { id } = await req.json();
    await Discount.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
