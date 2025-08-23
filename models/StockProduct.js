//food category
import { Schema, models, model } from "mongoose";

const StockProductSchema = new Schema({
    stockCategory: { type: String, required: true },
    quantity: { type: String, required: true },
    productName: { type: String, required: true },
    openingStock: { type: Number, required: true },
}, { timestamps: true });

export default models.StockProduct || model("StockProduct", StockProductSchema);