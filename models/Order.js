import mongoose from "mongoose";
const { Schema, model } = mongoose;

const StatusHistorySchema = new Schema({
    status: { type: String, required: true },
    message: { type: String, required: true },
    // Tracking info (only applicable for Shipped status)
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    updatedBy: { type: String, default: 'admin' },
    updatedAt: { type: Date, default: Date.now }
});

const OrderSchema = new Schema({
    // Cart and products
    products: [{
        // Core product info
        _id: { type: Schema.Types.ObjectId, ref: "Product" },
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        id: { type: String },
        name: { type: String, required: true },
        qty: { type: Number, required: true},
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, required: true, min: 0 },
        afterDiscount: { type: Number, required: true, min: 0 },
        
        // Product details
        image: { type: String, required: true },
        color: { type: String, default: '' },
        size: { type: String, default: '' },
        productCode: { type: String, default: '' },
        weight: { type: Number, default: 0 },
        totalQuantity: { type: Number, default: 0 },
        
        // Tax and pricing
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 },
        couponApplied: { type: Boolean, default: false },
        couponCode: { type: String, default: '' }
    }],
    // Checkout summary fields
    cartTotal: { type: Number },
    subTotal: { type: Number },
    totalDiscount: { type: Number },
    totalTax: { type: Number },
    shippingCost: { type: Number },
    promoCode: { type: String },
    promoDiscount: { type: Number },
    // Billing/shipping info
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    altPhone: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    address: { type: String },
    // Payment/order info
    orderId: { type: String }, // Razorpay or internal order id
    razorpayOrderId: { type: String }, // Razorpay order id 
    transactionId: { type: String, default: '' },
    payment: { type: String }, // 'cod' or 'online'
    status: { type: String, default: "Pending" },
    statusHistory: [StatusHistorySchema],
    paymentMethod: { type: String },
    datePurchased: { type: Date, default: Date.now },
    agree: { type: Boolean },
    // Add any additional checkout fields as needed
}, { timestamps: true });

export default mongoose.models.Order || model("Order", OrderSchema);