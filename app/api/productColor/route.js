import connectDB from '@/lib/connectDB';
import Color from '@/models/Color';
import Product from '@/models/Product';

// GET /api/productColor/list - List all color entries with product title
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product');
  try {
    if (productId) {
      const color = await Color.findOne({ product: productId }).populate('product', 'title');
      return Response.json(color);
    } else {
      const all = await Color.find().populate('product', 'title');
      return Response.json(all);
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const { product, colors } = await req.json();
    if (!product || !Array.isArray(colors)) {
      return Response.json({ error: 'Missing product or colors' }, { status: 400 });
    }
    let colorDoc = await Color.findOne({ product });
    if (colorDoc) {
      colorDoc.colors = colors;
      // Only update 'active' if explicitly provided
      if (typeof req.body?.active === 'boolean') {
        colorDoc.active = req.body.active;
      }
      await colorDoc.save();
    } else {
      colorDoc = await Color.create({ product, colors, active: true });
    }
    // Push colorDoc._id to Product's color field
    await Product.findByIdAndUpdate(product, { color: colorDoc._id });
    return Response.json(colorDoc, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req) {
  await connectDB();
  try {
    const { id, active, colors } = await req.json();
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
    let update = {};
    if (typeof active === 'boolean') update.active = active;
    if (Array.isArray(colors)) update.colors = colors;
    if (Object.keys(update).length === 0)
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    const colorDoc = await Color.findByIdAndUpdate(id, update, { new: true });
    if (!colorDoc) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(colorDoc);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  await connectDB();
  try {
    const { product } = await req.json();
    if (!product) return Response.json({ error: 'Missing product' }, { status: 400 });
    await Color.deleteOne({ product });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
