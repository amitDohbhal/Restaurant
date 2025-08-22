//food category
import { Schema, models, model } from "mongoose";

const FoodCategorySchema = new Schema({
    categoryName: { type: String, required: true },
    order: { type: Number, required: true },
    image: { url: { type: String }, key: { type: String } },
}, { timestamps: true });

export default models.FoodCategory || model("FoodCategory", FoodCategorySchema);