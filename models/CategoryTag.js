import mongoose from 'mongoose';

const CategoryTagSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tags: [String]
}, { timestamps: true });

export default mongoose.models.CategoryTag || mongoose.model('CategoryTag', CategoryTagSchema);
