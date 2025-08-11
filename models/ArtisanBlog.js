const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArtisanBlogSchema = new Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String },
  shortDescription: { type: String }, // as HTML
  longDescription: { type: String }, // as HTML
  images: [{ url: String, key: String }],
  artisan: { type: Schema.Types.ObjectId, ref: 'Artisan', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ArtisanBlog || mongoose.model('ArtisanBlog', ArtisanBlogSchema);
