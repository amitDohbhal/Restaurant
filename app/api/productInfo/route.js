import connectDB from "@/lib/connectDB";
import Info from '@/models/Info';
import Product from '@/models/Product';

// POST: Add a section to a product's info
export async function POST(req) {
  await connectDB();
  try {
    const { productId, title, description } = await req.json();
    if (!productId || !title || !description) {
      return Response.json({ error: 'Missing productId, title, or description' }, { status: 400 });
    }
    let infoDoc = await Info.findOne({ product: productId });
    if (!infoDoc) {
      infoDoc = await Info.create({ product: productId, info: [{ title, description }] });
      // Link Info to Product
      await Product.findByIdAndUpdate(productId, { info: infoDoc._id });
    } else {
      // Defensive: never overwrite the array, always append
      if (!Array.isArray(infoDoc.info)) {
        infoDoc.info = [];
      }
      // Debug: log before and after
      // console.log('Before push:', infoDoc.info);
      infoDoc.info = [...infoDoc.info, { title, description }];
      // console.log('After push:', infoDoc.info);
      await infoDoc.save();
    }
    return Response.json({ success: true, info: infoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET: Get all info sections for a product
export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return Response.json({ error: 'Missing productId' }, { status: 400 });
    }
    const infoDoc = await Info.findOne({ product: productId });
    return Response.json({ info: infoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update a section by index
export async function PATCH(req) {
  await connectDB();
  try {
    const { productId, sectionIndex, title, description } = await req.json();
    if (!productId || sectionIndex === undefined || !title || !description) {
      return Response.json({ error: 'Missing productId, sectionIndex, title, or description' }, { status: 400 });
    }
    const infoDoc = await Info.findOne({ product: productId });
    if (!infoDoc || !infoDoc.info[sectionIndex]) {
      return Response.json({ error: 'Section not found' }, { status: 404 });
    }
    infoDoc.info[sectionIndex].title = title;
    infoDoc.info[sectionIndex].description = description;
    await infoDoc.markModified('info');
    await infoDoc.save();
    return Response.json({ success: true, info: infoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a section by index
export async function DELETE(req) {
  await connectDB();
  try {
    const { productId, sectionIndex } = await req.json();
    const index = Number(sectionIndex);
    if (!productId || isNaN(index)) {
      return Response.json({ error: 'Missing productId or sectionIndex' }, { status: 400 });
    }
    const infoDoc = await Info.findOne({ product: productId });
    if (!infoDoc || !Array.isArray(infoDoc.info) || index < 0 || index >= infoDoc.info.length) {
      return Response.json({ error: 'Section not found' }, { status: 404 });
    }
    infoDoc.info.splice(index, 1);
    await infoDoc.markModified('info');
    await infoDoc.save();

    // If no sections left, delete Info doc and unset from Product
    if (infoDoc.info.length === 0) {
      await Info.deleteOne({ _id: infoDoc._id });
      await Product.findByIdAndUpdate(productId, { $unset: { info: "" } });
      return Response.json({ success: true, info: null });
    }
    // console.log('After delete/save:', infoDoc.info);
    return Response.json({ success: true, info: infoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
