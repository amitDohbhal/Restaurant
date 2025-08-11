import connectDB from '@/lib/connectDB';
import Product from '@/models/Product';
import MenuBar from '@/models/MenuBar';
import mongoose from "mongoose";

export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category');

  let filter = {};
  if (q) {
    filter.title = { $regex: q, $options: 'i' };
  }

  let productIds = null;
  if (category && category !== 'all') {
    // Find the subMenu by _id
    const menu = await MenuBar.findOne({ "subMenu._id": category }, { "subMenu.$": 1 });
    if (menu && menu.subMenu && menu.subMenu.length > 0) {
      const subMenu = menu.subMenu[0];
      // subMenu.products is an array of ObjectIds
      productIds = subMenu.products;
      filter._id = { $in: productIds };
    } else {
      // No such category, return empty
      return Response.json({ products: [] });
    }
  }

  try {
    const products = await Product.find(filter)
      .select('title gallery quantity price')
      .populate({ path: 'gallery', select: 'mainImage' })
      .populate({ path: 'quantity', select: 'variants' })
      
      .limit(20);

    const mapped = products.map(prod => {
  // Get all variants
  const variants = Array.isArray(prod.quantity?.variants) ? prod.quantity.variants : [];
  // Calculate inStock (sum of all variant qty)
  const inStock = variants.reduce((sum, v) => sum + (v.qty || 0), 0);
  // Get image URL (handle nested structure and fallback)
  let imageUrl = prod.gallery?.mainImage?.url || prod.gallery?.mainImage?.url || "/placeholder.jpeg";
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  return {
    _id: prod._id,
    title: prod.title,
    image: imageUrl,
    price: variants.length > 0 ? variants[0].price : null,
    inStock,
    variants,
    colors,
    sizes,
  };
});

    return Response.json({ products: mapped });
  } catch (error) {
    return Response.json({ products: [], error: error.message }, { status: 500 });
  }
}