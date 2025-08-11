import connectDB from '@/lib/connectDB';
import Discount from '@/models/Discount';

export async function POST(req) {
  await connectDB();
  try {
    const { promoCode, cartTotal } = await req.json();
    if (!promoCode || !cartTotal) {
      return Response.json({ error: 'Missing promoCode or cartTotal' }, { status: 400 });
    }
    const coupon = await Discount.findOne({ couponCode: promoCode.toUpperCase(), status: 'active' });
    if (!coupon) {
      return Response.json({ valid: false, error: 'Invalid or expired promo code.' }, { status: 404 });
    }
    // Check date validity
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return Response.json({ valid: false, error: 'Promo code not yet active.' }, { status: 400 });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return Response.json({ valid: false, error: 'Promo code expired.' }, { status: 400 });
    }
    // Calculate discount
    let discount = 0;
    if (coupon.percent) {
      discount = Math.round(cartTotal * (coupon.percent / 100));
    } else if (coupon.amount) {
      discount = coupon.amount;
    }
    // Discount cannot exceed cart total
    if (discount >= cartTotal) {
      return Response.json({ valid: false, error: 'Discount cannot exceed or equal cart total.' }, { status: 400 });
    }
    return Response.json({ valid: true, discount, coupon });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
