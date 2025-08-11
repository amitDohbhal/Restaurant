import { Schema, models, model } from "mongoose";

const ReviewSchema = new Schema({
  deleted: { type: Boolean, default: false },
  name: { type: String, required: true },
  date: { type: Number, required: true },
  thumb: {
    url: { type: String },
    key: { type: String }
  },
  rating: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  approved: { type: Boolean, default: false },

  // NEW FIELDS:
  type: { type: String, enum: ["product", "management", "all"], required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product" }, // for product reviews
  artisan: { type: Schema.Types.ObjectId, ref: "Artisan" }, // for artisan reviews

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default models.Review || model("Review", ReviewSchema);