const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArtisanBanner = new Schema({
  image: { url: String, key: String },
  artisan: { type: Schema.Types.ObjectId, ref: 'Artisan', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ArtisanBanner || mongoose.model('ArtisanBanner', ArtisanBanner);
