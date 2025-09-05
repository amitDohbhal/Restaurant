//food category
import { Schema, models, model, Types } from "mongoose";

const FoodInventorySchema = new Schema({
    categoryName: { type: String, required: true },
    categoryId: { type: Types.ObjectId, ref: 'FoodCategory', required: true },
    categoryType: { type: String },
    foodName: { type: String },
    qtyType: { type: String },
    halfPrice: { type: String },
    fullPrice: { type: String },
    quarterPrice: { type: String },
    perPiecePrice: { type: String },
    cgstPercent: { type: String },
    cgstAmount: { type: String },
    sgstPercent: { type: String },
    sgstAmount: { type: String },
    image: {
        url: { type: String },
        key: { type: String }
    },
    productTitle: { type: String },
    productDescription: { type: String },
    quantity: { type: Number, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
    notes: String,
    // Mutually exclusive CGST
    cgstPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    cgstAmount: {
        type: Number,
        min: 0,
        default: null
    },
    // Mutually exclusive SGST
    sgstPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    sgstAmount: {
        type: Number,
        min: 0,
        default: null
    },
    image: { url: { type: String }, key: { type: String } },
}, { timestamps: true });

// Enforce mutually exclusive CGST and SGST percent/amount
FoodInventorySchema.pre('validate', function(next) {
    // CGST: only one of percent or amount
    if (this.cgstPercent && this.cgstAmount) {
        return next(new Error('Only one of cgstPercent or cgstAmount should be provided.'));
    }
    // SGST: only one of percent or amount
    if (this.sgstPercent && this.sgstAmount) {
        return next(new Error('Only one of sgstPercent or sgstAmount should be provided.'));
    }
    next();
});


export default models.FoodInventory || model("FoodInventory", FoodInventorySchema);