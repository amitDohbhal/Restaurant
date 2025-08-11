const mongoose = require('mongoose');
const CitySchema = new mongoose.Schema({
  city: { type: String, required: true },
  pincode: { type: String },
  active: { type: Boolean, default: true },
}, { _id: false });

const DistrictStatusSchema = new mongoose.Schema({
  district: { type: String, required: true },
  active: { type: Boolean, default: true },
  cities: [CitySchema],
}, { _id: false });

const ZipCodeSchema = new mongoose.Schema({
  state: { type: String, required: true},
  active: { type: Boolean, default: true },
  districts: [DistrictStatusSchema],
}, { timestamps: true });

module.exports = mongoose.models.ZipCode || mongoose.model('ZipCode', ZipCodeSchema);
