import { Schema, models, model } from "mongoose";

const BasicInfoSchema = new Schema({
    image: { url: { type: String }, key: { type: String } },
    footerImage: { url: { type: String }, key: { type: String } },
    email1: { type: String },
    email2: { type: String },
    contactNumber1: { type: String },
    contactNumber2: { type: String },
    contactNumber3: { type: String },
    address1: { type: String },
    city1: { type: String },
    pincode1: { type: String },
    state1: { type: String },
    address2: { type: String },
    city2: { type: String },
    pincode2: { type: String },
    state2: { type: String },
    googleMap1: { type: String },
    googleMap2: { type: String },
    gstNumber: { type: String },
    companyNumber: { type: String },
}, { timestamps: true });

export default models.BasicInfo || model("BasicInfo", BasicInfoSchema);