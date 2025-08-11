import mongoose from 'mongoose';

const TagLineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

export default mongoose.models.TagLine || mongoose.model('TagLine', TagLineSchema);
