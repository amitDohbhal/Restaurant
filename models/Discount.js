const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  couponCode: { type: String, required: true, unique: true },
  amount: { type: Number }, // Fixed discount amount
  percent: { type: Number }, // Percentage discount
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
//   category: { type: String }, // Optional: could be used for filtering
  status: {
    type: String,
    enum: ['active', 'paused', 'expired'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);
