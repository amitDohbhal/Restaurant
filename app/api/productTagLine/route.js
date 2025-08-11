import ProductTagLine from '../../../models/ProductTagLine';
import connectDB from "@/lib/connectDB";
import Product from '@/models/Product';

// GET: Return all unique tags if allTags=1, else normal behavior
export async function GET(req) {
  await connectDB();
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('allTags') === '1') {
    // Return all unique tags
    const allTagsDocs = await ProductTagLine.find({}, 'tags');
    const tagsSet = new Set();
    allTagsDocs.forEach(doc => {
      if (Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Response.json({ tags: Array.from(tagsSet) });
  }
  const product = url.searchParams.get('product');
  if (product) {
    try {
      const entry = await ProductTagLine.findOne({ product });
      return Response.json({ success: true, data: entry });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  return Response.json({ error: 'Missing required query parameter: allTags=1 or product=ID' }, { status: 400 });
}

// POST: Create or update tags for a product
export async function POST(req) {
  await connectDB();
  try {
    const { product, tagLine } = await req.json();
    if (!product || typeof tagLine !== 'string' || !tagLine.trim()) {
      return Response.json({ error: 'Product and tagLine are required.' }, { status: 400 });
    }
    // Check if a ProductTagLine already exists for this product
    let created = await ProductTagLine.findOneAndUpdate(
      { product },
      { $set: { tagLine } },
      { new: true, upsert: true }
    );
    // Push the ProductTagLine _id to the product's ProductTagLine field
    if (created && created._id) {
      await Product.findByIdAndUpdate(product, { $set: { productTagLine: created._id } });
    }
    return Response.json({ success: true, data: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update tags for a product (only if exists)
export async function PATCH(req) {
  await connectDB();
  try {
    const { product, tagLine } = await req.json();
    if (!product || typeof tagLine !== 'string' || !tagLine.trim()) {
      return Response.json({ error: 'Product and tagLine are required.' }, { status: 400 });
    }
    const updated = await ProductTagLine.findOneAndUpdate(
      { product },
      { $set: { tagLine } },
      { new: true }
    );
    if (updated) {
      await Product.findByIdAndUpdate(
        updated.product, // ensure we use the updated ProductTagLine's product field
        { productTagLine: updated._id }
      );
    }
    if (!updated) {
      return Response.json({ error: 'CategoryTag entry not found for this product.' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}



// DELETE: Remove a tag from a product
// DELETE: Delete a category tag by product or _id
export async function DELETE(req) {
  await connectDB();
  try {
    const url = new URL(req.url, 'http://localhost');
    const product = url.searchParams.get('product');
    const id = url.searchParams.get('id');
    let result;
    if (product) {
      result = await ProductTagLine.deleteOne({ product });
      await Product.findByIdAndUpdate(product, { $unset: { productTagLine: "" } });
    } else if (id) {
      result = await ProductTagLine.deleteOne({ _id: id });
    } else {
      return Response.json({ error: "Product or id required." }, { status: 400 });
    }
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}