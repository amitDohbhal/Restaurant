import mongoose from 'mongoose';

const InfoSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  info: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Info || mongoose.model('Info', InfoSchema);
