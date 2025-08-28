// Direct Food Invoice
import { Schema, models, model } from "mongoose";

const CreateDirectFoodInvoiceSchema = new Schema({ 
    guestFirst: { type: String, required: true },
    
    // Payment Details
    paymentMode: { 
        type: String, 
        required: true, 
        enum: ['online', 'cash', 'room'],
        default: 'cash' 
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    
    // Invoice Details
    invoiceDate: { type: String, required: true },
    invoiceNo: { type: String, required: true, unique: true },
    
    // Payment Gateway
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    razorpaySignature: { type: String },
    
    // Food Items
    foodItems: [{
        foodItem: { type: Schema.Types.ObjectId, ref: 'FoodInventory', required: true },
        categoryName: { type: String, required: true },
        foodName: { type: String, required: true },
        qtyType: { type: String, required: true, enum: ['quarter', 'half', 'full', 'per piece'] },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        amount: { type: Number, required: true },
        cgstPercent: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstPercent: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 }
    }],
    
    // Totals
    totalFoodAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gstOnFood: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'],
        default: 'pending' 
    },
    paymentResponse: { type: Object },
}, { timestamps: true });

export default models.CreateDirectFoodInvoice || model("CreateDirectFoodInvoice", CreateDirectFoodInvoiceSchema);