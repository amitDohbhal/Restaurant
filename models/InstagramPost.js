import mongoose from "mongoose";

const InstagramPostSchema = new mongoose.Schema({
  image: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ["instagram", "facebook"], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.InstagramPost || mongoose.model("InstagramPost", InstagramPostSchema, "instagramposts");