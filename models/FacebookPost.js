import mongoose from "mongoose";

const FacebookPostSchema = new mongoose.Schema({
  image: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ["instagram", "facebook"], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.FacebookPost || mongoose.model("FacebookPost", FacebookPostSchema, "facebookposts");
