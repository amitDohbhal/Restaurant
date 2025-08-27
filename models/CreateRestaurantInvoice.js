//Room Invoice
import { Schema, models, model } from "mongoose";

const CreateRestaurantInvoiceSchema = new Schema({
  // Room Details
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  roomPrice: { type: Number },
  planType: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  totalDays: { type: Number, required: true },
  
  // Guest Details
  guestFirst: { type: String, required: true },
  guestMiddle: { type: String },
  guestLast: { type: String },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  
  // Address
  city: { type: String },
  pin: { type: String },
  state: { type: String },
  address: { type: String },
  company: { type: String },
  gstNo: { type: String },
  
  // Payment Details
  paymentMode: { 
    type: String, 
    required: true, 
    enum: ['online', 'cash', 'room', 'print'],
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
  paymentResponse: { type: Object }, // Raw response from Razorpay
}, { timestamps: true });

export default models.CreateRestaurantInvoice || model("CreateRestaurantInvoice", CreateRestaurantInvoiceSchema);