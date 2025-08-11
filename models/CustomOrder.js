import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CustomOrderSchema = new Schema({
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    transactionId: { type: String, default: '' },
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
        pickupDetails: {
            city: { type: String },
            vehicleType: { type: String },
            vehiclePrice: { type: Number },
        },
        dropoffDetails: {
            city: { type: String },
            vehicleType: { type: String },
            vehiclePrice: { type: Number },
        }
    },
    amount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    chatStatus: { type: String, default: "Pending" },
    paymentMethod: { type: String },
    bank: { type: String },
    cardType: { type: String },
    customOrder: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.CustomOrder || model("CustomOrder", CustomOrderSchema);