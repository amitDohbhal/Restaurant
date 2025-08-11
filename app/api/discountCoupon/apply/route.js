import connectDB from '@/lib/connectDB';
import Discount from '@/models/Discount';

export async function POST(req) {
  await connectDB();
  try {
    const { code, cart } = await req.json();
    // console.log('Coupon apply request:', { code, cart });
    if (!code) {
      console.error('No coupon code provided');
      return Response.json({ success: false, message: 'No coupon code provided.' }, { status: 400 });
    }
    // Find coupon by code and check validity
    const coupon = await Discount.findOne({ couponCode: code.trim(), status: 'active' });
    // console.log('Coupon lookup result:', coupon);
    if (!coupon) {
      console.error('Coupon not found or inactive for code:', code);
      return Response.json({ success: false, message: 'Coupon not found or inactive.' }, { status: 404 });
    }
    // Check date validity
    const now = new Date();
    if ((coupon.startDate && now < coupon.startDate) || (coupon.endDate && now > coupon.endDate)) {
      console.error('Coupon expired or not active yet:', coupon.startDate, coupon.endDate, now);
      return Response.json({ success: false, message: 'Coupon expired or not active yet.' }, { status: 400 });
    }
    // Optionally: check usage limits, user restrictions, etc.
    // For now, just return coupon data
    return Response.json({ success: true, coupon: {
      couponCode: coupon.couponCode,
      percent: coupon.percent,
      amount: coupon.amount,
      description: coupon.description
    }});
  } catch (err) {
    console.error('Coupon apply error:', err);
    return Response.json({ success: false, message: err.message, error: String(err) }, { status: 500 });
  }
}

