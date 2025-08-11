import { models, Schema, model } from "mongoose";

const PackageSchema = new Schema({
    reviews: { type: [Schema.Types.ObjectId], ref: "Review" },
    link: { type: String },
    active: { type: Boolean },
    order: { type: Number },
    packageCode: { type: String },
    packageName: { type: String },
    isDirect: { type: Boolean, default: false },
    price: { type: Number },
    priceUnit: { type: String },
    basicDetails: {
        thumbnail: { url: { type: String }, key: { type: String } },
        imageBanner: { url: { type: String }, key: { type: String } },
        location: { type: String },
        groupBooking: { type: String },
        tourType: { type: String },
        duration: { type: Number },
        heliBooking: { type: String },
        planCalculator: { type: String },
        notice: { type: String },
        smallDesc: { type: String },
        fullDesc: { type: String },
    },
    info: [{
        typeOfSelection: { type: String },
        selectionTitle: { type: String },
        selectionDesc: { type: String },
        order: { type: Number },
    }],
    gallery: [{
        url: { type: String },
        key: { type: String },
    }],
    createPlanType: [{
        day: { type: String },
        state: { type: String },
        city: { type: String },
    }],
    vehiclePlan: {
        vehicleName1: { type: String },
        vehicleName2: { type: String },
        vehicleName3: { type: String },
        vehiclePrice1: { type: Number },
        vehiclePrice2: { type: Number },
        vehiclePrice3: { type: Number },
        pickup: {
            state: { type: String },
            city: { type: String },
            price1: { type: String },
            price2: { type: String },
            price3: { type: String },
            vehicleType: [String],
        },
        drop: {
            state: { type: String },
            city: { type: String },
            price1: { type: String },
            price2: { type: String },
            price3: { type: String },
            vehicleType: [String],
        }
    }
});

export default models.Package || model("Package", PackageSchema);