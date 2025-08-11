import connectDB from "@/lib/connectDB";
import Product from '@/models/Product';
import Gallery from '@/models/Gallery';

export async function POST(req) {
  await connectDB();
  try {
    const { productId, mainImage, subImages } = await req.json();
    // console.log('API DEBUG received subImages:', subImages);
    if (!productId || !mainImage) {
      return new Response(JSON.stringify({ error: 'Missing or invalid productId/mainImage' }), { status: 400 });
    }
    // Create the gallery
    const gallery = await Gallery.create({ product: productId, mainImage, subImages });
    // Push gallery reference to product
    await Product.findByIdAndUpdate(productId, { gallery: gallery._id }, { new: true });
    return new Response(JSON.stringify(gallery), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  try {
    const galleries = await Gallery.find().populate('product');
    return new Response(JSON.stringify(galleries), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PATCH: Update a gallery (supports updating mainImage and subImages)
export async function PATCH(req) {
  await connectDB();
  try {
    const { galleryId, mainImage, subImages } = await req.json();
    if (!galleryId) {
      return new Response(JSON.stringify({ error: 'Missing galleryId' }), { status: 400 });
    }
    const update = {};
    if (mainImage !== undefined) update.mainImage = mainImage;
    if (subImages !== undefined) update.subImages = subImages;
    if (Object.keys(update).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
    }
    const gallery = await Gallery.findByIdAndUpdate(galleryId, update, { new: true });
    if (!gallery) {
      return new Response(JSON.stringify({ error: 'Gallery not found' }), { status: 404 });
    }
    // No need to update Product as gallery ref remains same
    return new Response(JSON.stringify(gallery), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE: Delete a gallery and remove ref from Product
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
  await connectDB();
  try {
    const { galleryId } = await req.json();
    if (!galleryId) {
      return new Response(JSON.stringify({ error: 'Missing galleryId' }), { status: 400 });
    }
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return new Response(JSON.stringify({ error: 'Gallery not found' }), { status: 404 });
    }
    // Remove gallery reference from Product
    await Product.findByIdAndUpdate(gallery.product, { $unset: { gallery: '' } });

    // Delete images from Cloudinary
    let errors = [];
    // Delete main image
    if (gallery.mainImage && gallery.mainImage.key) {
      try {
        await deleteFileFromCloudinary(gallery.mainImage.key);
      } catch (err) {
        errors.push(`Failed to delete main image: ${err.message}`);
      }
    }
    // Delete sub images
    if (Array.isArray(gallery.subImages)) {
      for (const img of gallery.subImages) {
        if (img && img.key) {
          try {
            await deleteFileFromCloudinary(img.key);
          } catch (err) {
            errors.push(`Failed to delete sub image (${img.key}): ${err.message}`);
          }
        }
      }
    }

    // Delete the gallery
    await Gallery.findByIdAndDelete(galleryId);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ success: false, errors }), { status: 207 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

