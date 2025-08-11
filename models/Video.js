import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },  
  videos: [{ url: String, description: String }],
}, { timestamps: true });

export default mongoose.models.Video || mongoose.model('Video', VideoSchema);
