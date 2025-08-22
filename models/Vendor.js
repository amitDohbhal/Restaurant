//food category
import { Schema, models, model } from "mongoose";

const VendorSchema = new Schema({
    vendors: [{
        vendorName: { type: String, required: true },
        vendorCallNo1: { type: String, required: true },
        vendorCallNo2: { type: String },
        vendorGstNo: { type: String }
    }],
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.Vendor || model("Vendor", VendorSchema);