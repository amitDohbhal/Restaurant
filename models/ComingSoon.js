import mongoose from "mongoose";

const ComingSoonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  days: { type: Number, required: true },
  tourType: { type: String, required: true },
  bannerUrl: { type: String, required: true },
  thumbUrl: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ComingSoon || mongoose.model("ComingSoon", ComingSoonSchema);
