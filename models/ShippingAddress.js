const mongoose = require('mongoose');
const { Schema } = mongoose;

const ShippingAddressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label:{type:String},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.models.ShippingAddress || mongoose.model('ShippingAddress', ShippingAddressSchema);