//food category
import { Schema, models, model } from "mongoose";

const StockCategorySchema = new Schema({
    categoryName: { type: String, required: true },
    quantityType: { type: String, required: false },
    order: { type: Number, required: true },
    image: { url: { type: String }, key: { type: String } },
}, { timestamps: true });

export default models.StockCategory || model("StockCategory", StockCategorySchema);