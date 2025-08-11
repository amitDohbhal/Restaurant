import connectDB from "@/lib/connectDB";
import Quantity from '@/models/Quantity';
import Product from '@/models/Product';
// GET: List all product quantity records or by productId
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  // Accept both 'product' and 'productId' for compatibility
  const productId = searchParams.get('product') || searchParams.get('productId');
  let result;
  if (productId) {
    result = await Quantity.findOne({ product: productId });
    return Response.json(result || {});
  } else {
    const quantities = await Quantity.find({});
    return Response.json(quantities);
  }
}

// POST: Upsert (create or update) product quantity by productId
export async function POST(req) {
  await connectDB();
  const body = await req.json();
  if (!body.product || !Array.isArray(body.variants)) {
    return Response.json({ error: 'Missing product or variants' }, { status: 400 });
  }
  // Validate variants
  for (const v of body.variants) {
    if (!v.size || !v.color || typeof v.qty !== 'number' || typeof v.price !== 'number' || typeof v.weight !== 'number') {
      return Response.json({ error: 'Each variant must have size, color, qty, price, weight' }, { status: 400 });
    }
    
    // Process images for each variant
    if (v.profileImage && typeof v.profileImage === 'object') {
      // Ensure profileImage has required fields
      if (!v.profileImage.url || !v.profileImage.key) {
        return Response.json({ error: 'Profile image must have both url and key' }, { status: 400 });
      }
    }
    
    if (v.subImages && Array.isArray(v.subImages)) {
      // Validate each subImage
      for (const img of v.subImages) {
        if (typeof img !== 'object' || !img.url || !img.key) {
          return Response.json({ error: 'Each sub-image must have both url and key' }, { status: 400 });
        }
      }
    }
  }
  // Process and prepare variants data
  const processedVariants = body.variants.map(variant => {
    // Check if we have the new images structure
    if (variant.images) {
      return {
        ...variant,
        // Ensure the images object has the correct structure
        images: {
          profile: variant.images.profile || variant.profileImage || null,
          subImages: Array.isArray(variant.images.subImages) ? variant.images.subImages : 
                    (Array.isArray(variant.subImages) ? variant.subImages : [])
        },
        // Keep the old structure for backward compatibility
        profileImage: variant.images.profile || variant.profileImage || null,
        subImages: Array.isArray(variant.images.subImages) ? variant.images.subImages : 
                  (Array.isArray(variant.subImages) ? variant.subImages : [])
      };
    }
    
    // Fallback to old structure if images is not present
    return {
      ...variant,
      images: {
        profile: variant.profileImage || null,
        subImages: Array.isArray(variant.subImages) ? variant.subImages : []
      },
      // Keep the old structure for backward compatibility
      profileImage: variant.profileImage || null,
      subImages: Array.isArray(variant.subImages) ? variant.subImages : []
    };
  });

  // Upsert by product
  const updated = await Quantity.findOneAndUpdate(
    { product: body.product },
    { $set: { variants: processedVariants } },
    { new: true, upsert: true }
  );

  // Also update Product document: only set the quantity field to the Quantity _id
  await Product.findByIdAndUpdate(body.product, { quantity: updated._id });
  return Response.json(updated, { status: 201 });
}

// PUT: Update a product quality record by id
export async function PUT(req) {
  await connectDB();
  const { _id, ...rest } = await req.json();
  const updated = await Quantity.findByIdAndUpdate(_id, rest, { new: true });
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
  // Also update Product document: only set the quantity field to the Quantity _id
  if (rest.product) {
    const quantity = await Quantity.findOneAndUpdate(
      { product: rest.product },
      { quantity: updated._id },
      { new: true }
    );
    return Response.json({quantity});
  }
}

import { deleteFileFromCloudinary } from '@/utils/cloudinary';

// DELETE: Remove a product quality record by id (expects ?id=...)
export async function DELETE(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const productId = searchParams.get('productId');
  
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  
  try {
    // First get the quantity record to access the images
    const quantity = await Quantity.findById(id);
    
    if (!quantity) {
      return Response.json({ error: 'Quantity record not found' }, { status: 404 });
    }
    
    // Delete all images from Cloudinary
    const deletePromises = [];
    
    // Process each variant's images
    if (Array.isArray(quantity.variants)) {
      quantity.variants.forEach(variant => {
        // Delete profile image if exists
        if (variant.profileImage?.key) {
          deletePromises.push(
            deleteFileFromCloudinary(variant.profileImage.key)
              .catch(error => console.error('Error deleting profile image:', error))
          );
        }
        
        // Delete sub images if exist
        if (Array.isArray(variant.subImages)) {
          variant.subImages.forEach(image => {
            if (image?.key) {
              deletePromises.push(
                deleteFileFromCloudinary(image.key)
                  .catch(error => console.error('Error deleting sub image:', error))
              );
            }
          });
        }
      });
    }
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    // Delete the quantity record
    await Quantity.findByIdAndDelete(id);
    
    // Update the product to remove the quantity reference
    if (productId) {
      await Product.findByIdAndUpdate(productId, { $unset: { quantity: '' } });
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting quantity record:', error);
    return Response.json(
      { error: 'Failed to delete quantity record', details: error.message },
      { status: 500 }
    );
  }
}
