import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: { type: String }
});

const customerSchema = new mongoose.Schema({
  // Guest identification
  _id: { type: mongoose.Schema.Types.ObjectId, required: false },
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAccount' },
  
  // Contact information
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  
  // Room information
  roomNumber: { type: String },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  checkIn: { type: Date },
  checkOut: { type: Date },
  // For backward compatibility
  ...(this.guestId && { guestId: this.guestId })
}, { _id: false });  // Prevent creating _id for subdocument

const paymentSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['online', 'room-account', 'cash', 'card', 'pay_later'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  paidAt: { type: Date }
});

const runningOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: customerSchema,
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  payment: paymentSchema,
  orderType: {
    type: String,
    enum: ['dine-in', 'room-service', 'takeaway', 'delivery'],
    required: true
  },
  status: { 
    type: String, 
    enum: [
      'pending_payment', 
      'confirmed', 
      'preparing', 
      'ready', 
      'served', 
      'completed', 
      'cancelled',
      'refunded'
    ],
    default: 'pending_payment'
  },
  notes: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  servedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String }
}, { timestamps: true });

// Generate order number before saving
runningOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

const RunningOrder = mongoose.models.RunningOrder || mongoose.model('RunningOrder', runningOrderSchema);

export default RunningOrder;