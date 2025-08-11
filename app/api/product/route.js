// API Route for ProductProfile (Create Product)
import connectDB from "@/lib/connectDB";
import Product from '@/models/Product';
import Size from '@/models/Size';
import Color from '@/models/Color';
import Gallery from '@/models/Gallery';
import Video from '@/models/Video';
import Description from '@/models/Description';
import Info from '@/models/Info';
import CategoryTag from '@/models/CategoryTag';
import ProductReview from '@/models/ProductReview';
import Quantity from '@/models/Quantity';
import ProductCoupons from '@/models/ProductCoupons';
import ProductTax from '@/models/ProductTax';
import ProductTagLine from '@/models/ProductTagLine';
import PackagePdf from '@/models/PackagePdf';
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    // Accept all relevant fields
    const { title, code, isDirect, categoryTag, ...rest } = body;
    if (!title || !code) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    // If explicitly direct, ignore categoryTag
    let productData = {
      title,
      code,
      isDirect: true,
      ...rest
    };
    // If not direct, require categoryTag
    if (!isDirect) {
      if (!categoryTag) {
        return new Response(JSON.stringify({ error: 'categoryTag required for category products' }), { status: 400 });
      }
      productData.isDirect = false;
      productData.categoryTag = categoryTag;
    }
    // Create product with proper linkage
    const product = await Product.create(productData);
    // Add product ref to artisan
    return new Response(JSON.stringify(product), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    // Support direct products filter for ProductProfile page
    const isDirectParam = searchParams.get('isDirect');
    if (id) {
      // Find by MongoDB _id
      const product = await Product.findById(id)
        
        .populate('size')
        // .populate('color')
        .populate('price')
        .populate('gallery')
        .populate('video')
        .populate('description')
        .populate('info')
        .populate('categoryTag')
        .populate('productTagLine')
        .populate('reviews')
        .populate('quantity')
        .populate('coupons')
        .populate('taxes')
        .populate('pdfs');
      if (!product || !product.active) {
        return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
      }
      // Ensure taxes is populated
      if (product.taxes && typeof product.taxes === 'object' && product.taxes._id) {
        // Already populated
      } else if (product.taxes) {
        const TaxModel = (await import('@/models/ProductTax')).default;
        const taxDoc = await TaxModel.findById(product.taxes);
        product.taxes = taxDoc;
      }
      return new Response(JSON.stringify(product), { status: 200 });
    } else if (name) {
      // Fallback to slug search
      const product = await Product.findOne({ slug: name })
        
        .populate('size')
        // .populate('color')
        .populate('price')
        .populate('gallery')
        .populate('video')
        .populate('description')
        .populate('info')
        .populate('categoryTag')
        .populate('productTagLine')
        .populate('reviews')
        .populate('quantity')
        .populate('coupons')
        .populate('taxes')
        .populate('pdfs');

      if (!product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
      }
      // Ensure taxes is populated
      if (product.taxes && typeof product.taxes === 'object' && product.taxes._id) {
        // Already populated
      } else if (product.taxes) {
        const TaxModel = (await import('@/models/ProductTax')).default;
        const taxDoc = await TaxModel.findById(product.taxes);
        product.taxes = taxDoc;
      }
      return new Response(JSON.stringify(product), { status: 200 });
    } else {
      // Filter by isDirect if requested
      let filter = {};
      if (isDirectParam === 'true') filter.isDirect = true;
      if (isDirectParam === 'false') filter.isDirect = false;
      // Always filter for active products
      filter.active = true;
      let products = await Product.find(filter)
       
        .populate('price')
        .populate('gallery')
        .populate('video')
        .populate('description')
        .populate('info')
        .populate('categoryTag')
        .populate('productTagLine')
        .populate('reviews')
        .populate('quantity')
        .populate('coupons')
        .populate('taxes')
        .populate('pdfs');

      // Ensure taxes is populated for all products
      const TaxModel = (await import('@/models/ProductTax')).default;
      products = await Promise.all(products.map(async (product) => {
        if (product.taxes && typeof product.taxes === 'object' && product.taxes._id) {
          return product;
        } else if (product.taxes) {
          const taxDoc = await TaxModel.findById(product.taxes);
          product = product.toObject();
          product.taxes = taxDoc;
          return product;
        }
        return product;
      }));

      return new Response(JSON.stringify(products), { status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
