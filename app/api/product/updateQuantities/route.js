import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import Quantity from "@/models/Quantity";

export async function POST(req) {
  await connectDB();
  // console.log('--- Starting quantity update process ---');

  try {
    const { items } = await req.json();
    // console.log('Received update request with items:', JSON.stringify(items, null, 2));

    if (!Array.isArray(items) || items.length === 0) {
      const error = 'No items provided for quantity update';
      // console.error(error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error,
          results: []
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const [index, item] of items.entries()) {
      const { productId, variantId = 0, quantity } = item;
      // console.log(`\nProcessing item ${index + 1}/${items.length}:`, { productId, variantId, quantity });

      // Validate required fields
      if (!productId) {
        const error = 'Missing productId';
        // console.error('Validation failed:', { productId, variantId, quantity, error });
        results.push({
          productId,
          variantId,
          success: false,
          error
        });
        continue;
      }

      if (quantity === undefined || quantity === null) {
        const error = 'Missing or invalid quantity';
        // console.error('Validation failed:', { productId, variantId, quantity, error });
        results.push({
          productId,
          variantId,
          success: false,
          error
        });
        continue;
      }

      try {
        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
          const error = 'Product not found';
          // console.error(error, { productId });
          results.push({
            productId,
            variantId,
            success: false,
            error
          });
          continue;
        }
        // console.log('Found product:', { name: product.name, _id: product._id });

        // Find the quantity document
        const quantityDoc = await Quantity.findById(product.quantity);
        if (!quantityDoc) {
          const error = 'Quantity document not found';
          // console.error(error, { productQuantityRef: product.quantity });
          results.push({
            productId,
            variantId,
            success: false,
            error
          });
          continue;
        }
        // console.log('Found quantity document:', { 
        //   _id: quantityDoc._id, 
        //   variantsCount: quantityDoc.variants?.length || 0,
        //   currentTotal: quantityDoc.total || 0
        // });

        // Ensure variants array exists
        if (!quantityDoc.variants) {
          // console.log('Initializing empty variants array');
          quantityDoc.variants = [];
        }

        // Convert variantId to number in case it's a string
        const variantIndex = Number(variantId);
        
        // Ensure variant exists at index
        while (quantityDoc.variants.length <= variantIndex) {
          // console.log(`Adding new variant at index ${quantityDoc.variants.length}`);
          quantityDoc.variants.push({ 
            qty: 0,
            size: `Variant ${quantityDoc.variants.length + 1}`,
            weight: 0
          });
        }

        // Get current quantity before update
        const currentVariant = quantityDoc.variants[variantIndex] || {};
        const currentQty = currentVariant.qty || 0;
        
        // console.log('Current quantity:', { 
        //   variantId: variantIndex, 
        //   currentQty, 
        //   requestedDecrease: quantity,
        //   variantDetails: currentVariant
        // });

        // Update the quantity (decrease by ordered quantity)
        const newQty = Math.max(0, currentQty - quantity); // Prevent negative quantities
        quantityDoc.variants[variantIndex].qty = newQty;
        // console.log('New quantity after update:', newQty);

        // Recalculate total
        const previousTotal = quantityDoc.total || 0;
        quantityDoc.total = quantityDoc.variants.reduce(
          (sum, v) => sum + (v.qty || 0),
          0
        );
        // console.log('Updated total quantity:', { previousTotal, newTotal: quantityDoc.total });

        // Save the updated quantity document
        const savedDoc = await quantityDoc.save();
        // console.log('Successfully updated quantity in database:', {
        //   savedDocId: savedDoc._id,
        //   updatedVariant: savedDoc.variants[variantIndex]
        // });

        results.push({
          productId,
          variantId: variantIndex,
          success: true,
          previousQty: currentQty,
          newQty,
          message: 'Quantity updated successfully',
          variantDetails: savedDoc.variants[variantIndex]
        });
      } catch (error) {
        // console.error('Error updating quantity:', {
        //   error: error.message,
        //   stack: error.stack,
        //   productId,
        //   variantId
        // });
        results.push({
          productId,
          variantId,
          success: false,
          error: error.message,
          errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // Check if all updates were successful
    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    // console.log(`\n--- Update Summary ---`);
    // console.log(`Total items: ${results.length}`);
    // console.log(`Successfully updated: ${successCount}`);
    // console.log(`Failed to update: ${failureCount}`);
    
    results.forEach((result, index) => {
      if (result.success) {
        // console.log(`[${index}] Success: Product ${result.productId}, Variant ${result.variantId}: ${result.previousQty} → ${result.newQty}`);
      } else {
        // console.error(`[${index}] Failed: Product ${result.productId || 'N/A'}, Variant ${result.variantId || 'N/A'}: ${result.error || 'Unknown error'}`);
      }
    });

    if (allSuccess) {
      const response = {
        success: true,
        message: 'All quantities updated successfully',
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      };
      // console.log('\nSending success response:', JSON.stringify(response, null, 2));
      return new Response(JSON.stringify(response), { status: 200 });
      
    } else if (someSuccess) {
      const response = {
        success: true,
        message: 'Some quantities updated successfully',
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      };
      // console.warn('\nSending partial success response:', JSON.stringify(response, null, 2));
      return new Response(JSON.stringify(response), { status: 207 }); // Multi-status
      
    } else {
      const response = {
        success: false,
        message: 'Failed to update quantities',
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      };
      // console.error('\nSending error response:', JSON.stringify(response, null, 2));
      return new Response(JSON.stringify(response), { status: 400 });
    }

  } catch (error) {
    // console.error('Error in updateQuantities:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
