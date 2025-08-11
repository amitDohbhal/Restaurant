import ProductTax from '@/models/ProductTax';
import Product from '@/models/Product';
import connectDB from '@/lib/connectDB';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const product = searchParams.get('product');
  try {
    if (product) {
      const data = await ProductTax.findOne({ product }).populate('product', 'title');
      return Response.json({ data });
    } else {
      const data = await ProductTax.find({}).populate('product', 'title');
      return Response.json({ data });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try { 
    const { product, cgst, sgst } = await req.json();
    if (!product) return Response.json({ error: 'Product is required' }, { status: 400 });
    let doc = await ProductTax.findOne({ product });
    if (doc) {
      return Response.json({ error: 'Tax already exists for this product' }, { status: 400 });
    } else {
      doc = await ProductTax.create({ product, cgst, sgst });
      // Also update the Product model to link the tax
      const Product = (await import("@/models/Product")).default;
      await Product.findByIdAndUpdate(product, { taxes: doc._id });
    }
    return Response.json({ data: doc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await connectDB();
  try {
    const { product, cgst, sgst } = await req.json();
    if (!product) return Response.json({ error: 'Product is required' }, { status: 400 });
    const doc = await ProductTax.findOneAndUpdate(
      { product },
      { cgst, sgst },
      { new: true }
    );
    // Also update the Product model to link the tax
    const Product = (await import("@/models/Product")).default;
    await Product.findByIdAndUpdate(product, { taxes: doc._id });
    return Response.json({ data: doc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  try {
    const { product, tax } = await req.json();
    if (!product) return Response.json({ error: 'Product is required' }, { status: 400 });
    if (tax === '__all__') {
      // Remove all taxes for product
      await ProductTax.deleteOne({ product });
      // Also update the Product model to remove the tax reference
      await Product.findByIdAndUpdate(product, { taxes: null });
      return Response.json({ success: true });
    } else {
      // Remove a single tax from the array
      // Remove the ProductTax document for this product
      const doc = await ProductTax.findOneAndDelete({ _id: tax, product });
      // Also update the Product model to remove the tax
      const Product = (await import("@/models/Product")).default;
      const prod = await Product.findById(product);
      if (prod && prod.taxes && prod.taxes.toString() === tax) {
        await Product.findByIdAndUpdate(product, { taxes: null });
      }
      return Response.json({ data: doc });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
