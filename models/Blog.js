import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String },
  shortDescription: { type: String }, // as HTML
  longDescription: { type: String }, // as HTML
  images: [{ url: String, key: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
