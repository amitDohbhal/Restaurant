import mongoose from 'mongoose';

// ProductTagLine: Associates a single tagLine (string) with a product. Both fields are required.
const ProductTagSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // required
  tagLine: { type: String, required: true } // required
}, { timestamps: true });

export default mongoose.models.ProductTagLine || mongoose.model('ProductTagLine', ProductTagSchema);
