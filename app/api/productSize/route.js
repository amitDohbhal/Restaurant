import connectDB from "@/lib/connectDB";
import Size from '@/models/Size';
import Product from '@/models/Product';
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

// Create a new size and link it to the product
export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { product, sizes, sizeChartUrl, sizeStyle1 } = body;
  if (!product) {
    return new Response(JSON.stringify({ error: 'Missing product ID' }), { status: 400 });
  }
  // Prevent duplicate size entry for this product
  const existing = await Size.findOne({ product });
  if (existing) {
    return new Response(JSON.stringify({ error: 'Sizes for this product already exist' }), { status: 409 });
  }
  // Create the size document (sizeChartUrl is optional)
  const sizeDoc = await Size.create({ product, sizes, sizeChartUrl, sizeStyle1 });
  // Update the product to reference this size doc and push size data
  await Product.findByIdAndUpdate(
    product,
    {
      size: sizeDoc._id,
      $set: { sizes: sizes || [], sizeChartUrl: sizeChartUrl || { url: '', key: '' }, sizeStyle1: sizeStyle1 || '' }
    },
    { new: true }
  );
  return new Response(JSON.stringify(sizeDoc), { status: 201 });
}

// Get size by product ID
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const product = searchParams.get('product');
  if (!product) {
    return new Response(JSON.stringify({ error: 'Missing product ID' }), { status: 400 });
  }
  const sizeDoc = await Size.findOne({ product });
  if (!sizeDoc) {
    return new Response(JSON.stringify({ error: 'Size not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(sizeDoc), { status: 200 });
}

// Update size by size ID
export async function PATCH(req) {
  await connectDB();
  const body = await req.json();
  const { id, product, sizes, sizeChartUrl, sizeStyle1, ...update } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing size ID' }), { status: 400 });
  }
  const updated = await Size.findByIdAndUpdate(id, { ...update, sizes, sizeChartUrl, sizeStyle1 }, { new: true });
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Size not found' }), { status: 404 });
  }
  // Also update the Product document's embedded size fields
  if (product) {
    await Product.findByIdAndUpdate(
      product,
      {
        $set: { sizes: sizes || [], sizeChartUrl: sizeChartUrl || { url: '', key: '' }, sizeStyle1: sizeStyle1 || '' }
      },
      { new: true }
    );
  }
  return new Response(JSON.stringify(updated), { status: 200 });
}

// Delete size by size ID and remove reference from Product
export async function DELETE(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing size ID' }), { status: 400 });
  }
  const sizeDoc = await Size.findByIdAndDelete(id);
  if (!sizeDoc) {
    return new Response(JSON.stringify({ error: 'Size not found' }), { status: 404 });
  }
  // Delete size chart image from Cloudinary if present
  if (sizeDoc.sizeChartUrl) {
    try {
      let key = '';
      if (typeof sizeDoc.sizeChartUrl === 'object' && sizeDoc.sizeChartUrl.key) {
        key = sizeDoc.sizeChartUrl.key;
      } else if (typeof sizeDoc.sizeChartUrl === 'string' && sizeDoc.sizeChartUrl) {
        // Legacy: extract from URL
        const urlParts = sizeDoc.sizeChartUrl.split('/upload/');
        if (urlParts.length === 2) {
          key = urlParts[1].replace(/\.[^/.]+$/, "");
        }
      }
      if (key) {
        await deleteFileFromCloudinary(key);
      }
    } catch (err) {
      console.error('Cloudinary deletion failed (sizeChart):', err.message);
    }
  }
  // Remove reference from Product
  await Product.findByIdAndUpdate(sizeDoc.product, { $unset: { size: 1 } });
  return new Response(JSON.stringify({ message: 'Size deleted' }), { status: 200 });
}

