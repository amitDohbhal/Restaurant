import { Schema, models, model } from "mongoose";

const StockQuantityTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

export default models.StockQuantityType || model("StockQuantityType", StockQuantityTypeSchema);