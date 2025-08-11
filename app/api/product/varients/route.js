import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import Quantity from "@/models/Quantity"; // Make sure you have this model

export async function PUT(req) {
  try {
    await connectDB();
    const { productId, variantIndex, newQty } = await req.json();

    // First get the product to find the quantity reference
    const product = await Product.findById(productId);
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }), 
        { status: 404 }
      );
    }

    if (!product.quantity) {
      return new Response(
        JSON.stringify({ error: 'Quantity reference not found for this product' }), 
        { status: 404 }
      );
    }

    // Update the quantity document directly
    const quantityDoc = await Quantity.findById(product.quantity);
    if (!quantityDoc) {
      return new Response(
        JSON.stringify({ error: 'Quantity document not found' }), 
        { status: 404 }
      );
    }

    // Ensure variants array exists
    if (!quantityDoc.variants) {
      quantityDoc.variants = [];
    }

    // Ensure variant exists at index
    while (quantityDoc.variants.length <= variantIndex) {
      quantityDoc.variants.push({ qty: 0 });
    }

    // Update the quantity
    quantityDoc.variants[variantIndex].qty = newQty;
    
    // Recalculate total
    quantityDoc.total = quantityDoc.variants.reduce(
      (sum, v) => sum + (v.qty || 0), 
      0
    );

    // Save the quantity document
    await quantityDoc.save({ validateBeforeSave: true })
      .catch(err => {
        throw err;
      });

    // Get fresh data
    const updatedQuantity = await Quantity.findById(quantityDoc._id);
    return new Response(
      JSON.stringify({ 
        success: true,
        quantity: updatedQuantity
      }), 
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), 
      { status: 500 }
    );
  }
}