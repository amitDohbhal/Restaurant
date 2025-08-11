import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CustomOrderVisitorsSchema = new Schema({
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    formData: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: Number, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: Number, required: true },
        address: { type: String, required: true },
        extraAddressInfo: { type: String },
        instructions: { type: String },
    },
    bookingDetails: {
        departureLocation: { type: String, required: true },
        travelDate: { type: Date, required: true },
    },
    heliFormData: {
        numAdults: { type: Number },
        numChildren: { type: Number },
        numInfants: { type: Number },
        adults: [{
            fullName: { type: String },
            age: { type: Number },
            weight: { type: Number },
            idProof: {
                url: { type: String },
                key: { type: String }
            }
        }],
        children: [{
            fullName: { type: String },
            age: { type: Number },
            weight: { type: Number },
            idProof: {
                url: { type: String },
                key: { type: String }
            }
        }],
        infants: [{
            fullName: { type: String },
            age: { type: Number },
            weight: { type: Number },
            idProof: {
                url: { type: String },
                key: { type: String }
            }
        }],
        pickupLocation: { type: String },
        dropoffLocation: { type: String },
        medicalRequirements: { type: String },
        specialRequirements: { type: String },
    },
    customPackageForm: {
        travelDate: { type: Date },
        packagePlan: { type: String },
        mealPlan: { type: String },
        numAdults: { type: Number },
        numChildren: { type: Number },
        numMattress: { type: Number },
        vehicleType: { type: String },
        vehiclePrice: { type: Number },
        totalAmount: { type: Number },
        pickupRequired: { type: String },
        pickupDetails: {
            city: { type: String },
            vehicleType: { type: String },
            vehiclePrice: { type: Number },
        },
        dropoffRequired: { type: String },
        dropoffDetails: {
            city: { type: String },
            vehicleType: { type: String },
            vehiclePrice: { type: Number },
        }
    },
    amount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.models.CustomOrderVisitors || model("CustomOrderVisitors", CustomOrderVisitorsSchema);