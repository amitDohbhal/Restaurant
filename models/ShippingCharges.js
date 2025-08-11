import mongoose from 'mongoose';

const ShippingChargeSchema = new mongoose.Schema({
  charges: [
    {
      label: { type: String, required: true },
      shippingCharge: { type: Number, required: true, min: 0, default: 0 }
    }
  ],
}, { timestamps: true });

export default mongoose.models.ShippingCharge || mongoose.model('ShippingCharge', ShippingChargeSchema);