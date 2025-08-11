import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  mainImage: {
    url: { type: String, required: true },
    key: { type: String, required: true }
  },
  subImages: [{
    url: { type: String, required: true },
    key: { type: String, required: true }
  }],
}, { timestamps: true });

export default mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);
