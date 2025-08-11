import mongoose from 'mongoose';

const ArtisanCertificateSchema = new mongoose.Schema({
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artisan',
    required: true,
    index: true
  },
  title: { type: String, required: true }, // Certificate name/title
  issueDate: { type: String }, // Year of issue
  issuedBy: { type: String }, // Certificate issued from
  description: { type: String }, // Specialization or description
  imageUrl:  { url: String, 
    key: String }, // Certificate image URL
}, {
  timestamps: true
});

module.exports = mongoose.models.ArtisanCertificate || mongoose.model('ArtisanCertificate', ArtisanCertificateSchema);
