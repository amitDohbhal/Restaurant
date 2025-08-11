import mongoose from 'mongoose';

const ColorSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  colors: [{ name: String, hex: String }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Color || mongoose.model('Color', ColorSchema);
