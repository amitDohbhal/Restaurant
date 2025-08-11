import mongoose from 'mongoose';

const PriceSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: Number,
  discount: Number
}, { timestamps: true });

export default mongoose.models.Price || mongoose.model('Price', PriceSchema);
