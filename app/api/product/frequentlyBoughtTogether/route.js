import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Product from '@/models/Product';
import Size from '@/models/Size';
import Color from '@/models/Color';
import mongoose from 'mongoose';

// Ensure models are registered
import '@/models/Size';
import '@/models/Color';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');

  if (!productId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await connectDB();
    const currentProduct = await Product.findById(new mongoose.Types.ObjectId(productId));
    if (!currentProduct || !currentProduct.category) {
      return NextResponse.json({ error: 'Product not found or missing category' }, { status: 404 });
    }
    const fbtProducts = await Product.find({
      _id: { $ne: new mongoose.Types.ObjectId(productId) },
      category: currentProduct.category,
      isDirect: false,
      active: true
    })
      .populate([
        'gallery',
        { path: 'color', model: 'Color' },
        { path: 'size', model: 'Size' },
        'price',
        'video',
        'description',
        'info',
        'categoryTag',
        'productTagLine',
        'quantity',
        'coupons',
        'pdfs'
      ])
      .limit(8)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return NextResponse.json(fbtProducts);
  } catch (error) {
    console.error('Error fetching frequently bought together products:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
