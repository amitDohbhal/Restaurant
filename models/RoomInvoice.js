//Room Invoice
import { Schema, models, model } from "mongoose";

const RoomInvoiceSchema = new Schema({
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  roomPrice: { type: Number, required: true },
  planType: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  totalDays: { type: Number, required: true },
  cgstPercent: { type: Number },
  cgstAmount: { type: Number },
  sgstPercent: { type: Number },
  sgstAmount: { type: Number },
  guestFirst: { type: String, required: true },
  guestMiddle: { type: String },
  guestLast: { type: String },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  city: { type: String, required: true },
  pin: { type: String, required: true },
  state: { type: String, required: true },
  address: { type: String },
  company: { type: String },
  gstNo: { type: String },
  extraCharges: { type: Number },
  discount: { type: Number },
  paymentMode: { type: String },
  paidAmount: { type: Number },
  dueAmount: { type: Number },
  invoiceDate: { type: String },
  invoiceNo: { type: String, required: true, unique: true },
  paymentStatus: { type: String }, // e.g. 'success', 'failed', 'pending'
  paymentResponse: { type: Object }, // Raw response from Razorpay (optional)
}, { timestamps: true });

export default models.RoomInvoice || model("RoomInvoice", RoomInvoiceSchema);