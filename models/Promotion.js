const mongoose = require('mongoose');
const { Schema } = mongoose;

const PromotionSchema = new Schema({
  title: { type: String, required: true },
  shortDescription: { type: String, required: true },
  rating: { type: Number, required: true },
  createdBy: { type: String, required: true },
  date: { type: Number, required: true },
  image: {
    url: { type: String },
    key: { type: String }
  },
  artisan: { type: Schema.Types.ObjectId, ref: 'Artisan', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
