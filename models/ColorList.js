const mongoose = require('mongoose');

const ColorListSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  hex: { type: String, required: true, unique: true }
});

module.exports = mongoose.models.ColorList || mongoose.model('ColorList', ColorListSchema);
