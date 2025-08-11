import { Schema, models, model } from "mongoose";

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default models.Wishlist || model("Wishlist", WishlistSchema);
