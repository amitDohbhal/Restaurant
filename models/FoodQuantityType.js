const mongoose = require('mongoose');

const FoodQuantityTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.models.FoodQuantityType || mongoose.model('FoodQuantityType', FoodQuantityTypeSchema);