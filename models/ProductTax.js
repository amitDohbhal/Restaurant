const mongoose = require('mongoose');

const ProductTaxSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const ProductTax = mongoose.models.ProductTax || mongoose.model('ProductTax', ProductTaxSchema);
export default ProductTax;
