// models/CancelOrder.js
import mongoose from 'mongoose';

const cancelOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: {
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      size: String,
      color: String
    }],
    totalAmount: Number,
    shippingAddress: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String
    },
    paymentStatus: String,
    paymentMethod: String,
    orderDate: Date
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  reason: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  userDetails: {
    name: String,
    contactNumber: String
  },
  adminNotes: String,
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

export default mongoose.models.CancelOrder || mongoose.model('CancelOrder', cancelOrderSchema);