//food category
import { Schema, models, model } from "mongoose";

const StockInventorySchema = new Schema({
    category: { type: String, required: true },
    productName: { type: String, required: true },
    qtyType: { type: String },
    openingStock: { type: String },
    stockIn: { type: Number },
    stockInDate: { type: Date },
    vendor: { type: String },
    invoice: { type: String },
    stockOut: { type: Number },
    stockOutDate: { type: Date },
    useType: { type: String },
    finalStockDate: { type: Date },
    finalStockQty: { type: Number },
    finalStockQtyType: { type: String },
}, { timestamps: true });

export default models.StockInventory || model("StockInventory", StockInventorySchema);