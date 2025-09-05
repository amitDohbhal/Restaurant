//food category
import { Schema, models, model, Types } from "mongoose";

const FoodCategorySchema = new Schema({
    categoryName: { type: String, required: true },
    foodInventoryIds: [{ type: Types.ObjectId, ref: 'FoodInventory' }],
    slug: { type: String, required: true },
    categoryProfileImage: { url: { type: String }, key: { type: String } },
    categoryBannerImage: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.FoodCategory || model("FoodCategory", FoodCategorySchema);