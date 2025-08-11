import mongoose from 'mongoose';

const ArtisanPluginSchema = new mongoose.Schema({
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artisan',
    required: true,
    index: true,
    unique: true // Each artisan has only one plugin set
  },
  facebook: { type: String, default: '' },
  google: { type: String, default: '' },
  instagram: { type: String, default: '' },
  youtube: { type: String, default: '' },
  website: { type: String, default: '' },
}, {
  timestamps: true
});
module.exports = mongoose.models.ArtisanPlugin || mongoose.model('ArtisanPlugin', ArtisanPluginSchema);