import { Schema, models, model } from "mongoose";

const EnquirySchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    adults: { type: Number, required: true },
    children: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    aptName: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: Number, required: true },
    extraInfo: { type: String },
    travelDate: { type: Date, required: true },
    pickupLocation: { type: String, required: true },
    status: { type: String, default: "Pending" },
}, { timestamps: true });

export default models.Enquiry || model("Enquiry", EnquirySchema);