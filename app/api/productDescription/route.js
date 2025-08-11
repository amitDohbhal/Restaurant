import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import Description from '@/models/Description';
import Product from '@/models/Product';

// POST: Add or update overview for a productexport async function POST(req) {
  await connectDB();
  try {
    const { productId, overview } = await req.json();
    if (!productId || !overview) {
      return NextResponse.json({ error: 'Missing productId or overview' }, { status: 400 });
    }
    let descDoc = await Description.findOne({ product: productId });
    if (descDoc) {
      descDoc.overview = overview;
      await descDoc.save();
    } else {
      descDoc = await Description.create({ product: productId, overview });
    }
    // Link Description to Product
    await Product.findByIdAndUpdate(productId, { description: descDoc._id });
    return NextResponse.json({ success: true, description: descDoc });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Get description for a product or all products
export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product') || searchParams.get('productId');
    if (productId) {
      const descDoc = await Description.findOne({ product: productId }).populate('product', 'title');
      return NextResponse.json({ description: descDoc });
    } else {
      // Return all product descriptions with product name
      const descDocs = await Description.find({}).populate('product', 'title');
      return NextResponse.json({ descriptions: descDocs });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update overview
export async function PATCH(req) {
  await connectDB();
  try {
    const { productId, overview } = await req.json();
    if (!productId || !overview) {
      return NextResponse.json({ error: 'Missing productId or overview' }, { status: 400 });
    }
    const descDoc = await Description.findOneAndUpdate(
      { product: productId },
      { overview },
      { new: true }
    );
    // Ensure Product.description is set
    if (descDoc) {
      await Product.findByIdAndUpdate(productId, { description: descDoc._id });
    }
    return NextResponse.json({ description: descDoc });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove description by productId
export async function DELETE(req) {
  await connectDB();
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }
    await Description.findOneAndDelete({ product: productId });
    await Product.findByIdAndUpdate(productId, { $unset: { description: "" } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
