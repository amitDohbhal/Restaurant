import CategoryTag from '../../../models/CategoryTag';
import connectDB from "@/lib/connectDB";
import Product from '@/models/Product';

// GET: Return all unique tags if allTags=1, else normal behavior
export async function GET(req) {
  await connectDB();
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('allTags') === '1') {
    // Return all unique tags
    const allTagsDocs = await CategoryTag.find({}, 'tags');
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
      const entry = await CategoryTag.findOne({ product });
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
    const { product, tags } = await req.json();
    if (!product || !Array.isArray(tags)) {
      return Response.json({ error: 'Product and tags are required.' }, { status: 400 });
    }
    // Check if a CategoryTag already exists for this product
    const exists = await CategoryTag.findOne({ product });
    if (exists) {
      return Response.json({ error: 'Category already exists for this product.' }, { status: 409 });
    }
    // Create new category tag
    const created = await CategoryTag.create({ product, tags });
    // Push the CategoryTag _id to the product's categoryTag field
    if (created && created._id) {
      await Product.findByIdAndUpdate(product, { $set: { categoryTag: created._id } });
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
    const { product, tags } = await req.json();
    if (!product || !Array.isArray(tags)) {
      return Response.json({ error: 'Product and tags are required.' }, { status: 400 });
    }
    const updated = await CategoryTag.findOneAndUpdate(
      { product },
      { $set: { tags } },
      { new: true }
    );
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
    const tag = url.searchParams.get('tag'); 
    let result;
    if (product) {
      result = await CategoryTag.deleteOne({ product });
      await Product.findByIdAndUpdate(product, { $unset: { categoryTag: "" } });
    } else if (id) {
      result = await CategoryTag.deleteOne({ _id: id });
    } else {
      // Remove a single tag from the tags array
      const updated = await CategoryTag.findOneAndUpdate(
        { product },
        { $pull: { tags: tag } },
        { new: true }
      );
    }
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}