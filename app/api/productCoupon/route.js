import connectDB from '@/lib/connectDB';
import ProductCoupons from '@/models/ProductCoupons';
import Product from '@/models/Product';

// GET: /api/productCoupon?productId=xxx OR /api/productCoupon
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  try {
    if (productId) {
      const doc = await ProductCoupons.findOne({ productId });
      return Response.json(doc || { productId, coupons: [] });
    } else {
      // Return all mappings
      const docs = await ProductCoupons.find({});
      return Response.json(docs);
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}



// POST: set coupons for a product (create only, do not overwrite)
export async function POST(req) {
  await connectDB();
  try {
    const { productId, coupon } = await req.json();
    if (!productId || !coupon) {
      return Response.json({ error: 'Missing productId or coupon' }, { status: 400 });
    }
    // coupon must be an object with couponCode, startDate, endDate
    if (!coupon.couponCode || !coupon.startDate || !coupon.endDate) {
      return Response.json({ error: 'Coupon must have couponCode, startDate, endDate' }, { status: 400 });
    }
    // Check if mapping already exists
    const existing = await ProductCoupons.findOne({ productId });
    if (existing) {
      return Response.json({ error: 'Coupon for this product already exists.' }, { status: 409 });
    }
    // Create new mapping
    const doc = await ProductCoupons.create({ productId, coupon });
    // Push the mapping ref to Product.coupons field
    await Product.findByIdAndUpdate(productId, { coupons: doc._id });
    return Response.json(doc);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
// PATCH: update coupon for a product
export async function PATCH(req) {
  await connectDB();
  try {
    const { productId, coupon } = await req.json();
    if (!productId || !coupon) {
      return Response.json({ error: 'Missing productId or coupon' }, { status: 400 });
    }
    // coupon must be an object with couponCode, startDate, endDate
    if (!coupon.couponCode || !coupon.startDate || !coupon.endDate) {
      return Response.json({ error: 'Coupon must have couponCode, startDate, endDate' }, { status: 400 });
    }
    // Update mapping
    const doc = await ProductCoupons.findOneAndUpdate(
      { productId },
      { coupon },
      { new: true, upsert: false }
    );
    if (!doc) {
      return Response.json({ error: 'Mapping not found' }, { status: 404 });
    }
    return Response.json(doc);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
// DELETE: remove all coupons for a product
export async function DELETE(req) {
  await connectDB();
  try {
    const { productId } = await req.json();
    if (!productId) return Response.json({ error: 'Missing productId' }, { status: 400 });
    await ProductCoupons.deleteOne({ productId });
    // Remove the mapping ref from Product.coupons field
    await Product.findByIdAndUpdate(productId, { coupons: null });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
